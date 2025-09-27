import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Yacht } from "../types/yacht";

// Your AISStream API key
const API_KEY = "a8437deb4bfa21aa490de22b93bee19dcbb76540";

interface Position {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp: string;
}

interface Props {
  yachts: Yacht[];
  onLocationUpdate: (mmsi: string, data: Position) => void;
}

const LOG_PREFIX = "🔌 [WebSocket]";

class StableConnectionManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout?: NodeJS.Timeout;
  private heartbeatInterval?: NodeJS.Timeout;
  private currentRetry = 0;
  private maxRetries = 10;
  private isConnecting = false;
  private hasSubscribed = false;
  private subscriptionData: any = null;
  private lastSubscriptionTime = 0;
  private readonly minSubscriptionInterval = 10000; // 10 seconds minimum between subscriptions

  constructor(
    private readonly onMessage: (event: MessageEvent) => void,
    private readonly onConnect: () => void
  ) { }

  public connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    console.log(`${LOG_PREFIX} Connecting (attempt ${this.currentRetry + 1})`);

    try {
      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.ws.onopen = () => {
        console.log(`${LOG_PREFIX} ✅ Connected successfully`);
        this.isConnecting = false;
        this.currentRetry = 0;
        this.hasSubscribed = false;

        // Start heartbeat to keep connection alive
        this.startHeartbeat();

        // Trigger subscription
        this.onConnect();
      };

      this.ws.onmessage = (event) => {
        // Reset heartbeat on any message
        this.resetHeartbeat();

        try {
          console.log(`${LOG_PREFIX} 📨 Raw message received:`, typeof event.data, event.data.length || 'no length');

          let messageData;
          if (typeof event.data === 'string') {
            messageData = JSON.parse(event.data);
          } else if (event.data instanceof ArrayBuffer) {
            const text = new TextDecoder().decode(event.data);
            messageData = JSON.parse(text);
          } else {
            messageData = event.data;
          }

          console.log(`${LOG_PREFIX} 📨 Parsed message:`, JSON.stringify(messageData, null, 2));

          // Check if this is a subscription confirmation
          if (messageData.Message === "Subscription successful") {
            console.log(`${LOG_PREFIX} ✅ Subscription confirmed by server`);
            this.hasSubscribed = true;
            return;
          }

          // Check for error messages
          if (messageData.Error || messageData.error) {
            console.error(`${LOG_PREFIX} ❌ Server error:`, messageData.Error || messageData.error);
            return;
          }

          // Process AIS data
          this.onMessage(event);
        } catch (error) {
          console.error(`${LOG_PREFIX} ❌ Message processing error:`, error);
        }
      };

      this.ws.onerror = (error) => {
        console.error(`${LOG_PREFIX} ❌ WebSocket error:`, error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log(`${LOG_PREFIX} Connection closed (code: ${event.code}, reason: ${event.reason})`);
        this.isConnecting = false;
        this.hasSubscribed = false;
        this.stopHeartbeat();

        // Don't reconnect if it was a clean close or max retries reached
        if (event.code === 1000 || this.currentRetry >= this.maxRetries) {
          console.log(`${LOG_PREFIX} Not reconnecting (clean close or max retries)`);
          return;
        }

        // Exponential backoff with jitter
        const delay = Math.min(1000 * Math.pow(2, this.currentRetry) + Math.random() * 1000, 30000);
        this.currentRetry++;

        console.log(`${LOG_PREFIX} Reconnecting in ${Math.round(delay / 1000)}s...`);
        this.reconnectTimeout = setTimeout(() => this.connect(), delay);
      };

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Connection creation failed:`, error);
      this.isConnecting = false;
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send a ping to keep connection alive
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error(`${LOG_PREFIX} Heartbeat failed:`, error);
        }
      }
    }, 30000); // Ping every 30 seconds
  }

  private resetHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.startHeartbeat();
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = undefined;
    }
  }

  public subscribe(subscriptionData: any) {
    this.subscriptionData = subscriptionData;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log(`${LOG_PREFIX} ⏳ Queuing subscription (connection not ready)`);
      return false;
    }

    // Rate limiting check
    const now = Date.now();
    if (now - this.lastSubscriptionTime < this.minSubscriptionInterval) {
      const waitTime = this.minSubscriptionInterval - (now - this.lastSubscriptionTime);
      console.log(`${LOG_PREFIX} ⏳ Rate limited - waiting ${Math.round(waitTime / 1000)}s before subscription`);

      setTimeout(() => {
        this.subscribe(subscriptionData);
      }, waitTime);
      return false;
    }

    try {
      console.log(`${LOG_PREFIX} 📡 Sending subscription for ${subscriptionData.FiltersShipMMSI.length} vessels`);

      this.ws.send(JSON.stringify(subscriptionData));
      this.lastSubscriptionTime = now;
      console.log(`${LOG_PREFIX} ✅ Subscription sent successfully`);
      return true;
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Subscription failed:`, error);
      return false;
    }
  }

  public cleanup() {
    this.stopHeartbeat();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close(1000, "Component unmounting");
      this.ws = null;
    }
    this.isConnecting = false;
    this.hasSubscribed = false;
  }

  public getConnectionState() {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      subscribed: this.hasSubscribed,
      retryCount: this.currentRetry
    };
  }
}

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const connectionManager = useRef<StableConnectionManager | null>(null);
  const appState = useRef(AppState.currentState);
  const yachtsRef = useRef(yachts);

  // Update yachts ref when prop changes
  useEffect(() => {
    yachtsRef.current = yachts;
  }, [yachts]);

  // Get tracked vessels (rotate through all yachts in batches of 50)
  const trackedVessels = useMemo(() => {
    const validYachts = yachtsRef.current
      .filter((yacht) => {
        const mmsi = yacht.mmsi?.toString().trim();
        return mmsi && /^\d{7,9}$/.test(mmsi);
      });

    console.log(`${LOG_PREFIX} 📊 Total valid yachts: ${validYachts.length}`);
    return validYachts.map(yacht => yacht.mmsi.toString());
  }, [yachtsRef.current]);

  // Batch rotation state
  const [currentBatch, setCurrentBatch] = useState(0);
  const batchSize = 50;
  const totalBatches = Math.ceil(trackedVessels.length / batchSize);

  // Get current batch of vessels
  const currentVessels = useMemo(() => {
    const startIndex = currentBatch * batchSize;
    const batch = trackedVessels.slice(startIndex, startIndex + batchSize);
    console.log(`${LOG_PREFIX} 🔄 Batch ${currentBatch + 1}/${totalBatches} (${batch.length} vessels)`);
    return batch;
  }, [trackedVessels, currentBatch, batchSize, totalBatches]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      let data;
      if (typeof event.data === 'string') {
        data = JSON.parse(event.data);
      } else if (event.data instanceof ArrayBuffer) {
        const text = new TextDecoder().decode(event.data);
        data = JSON.parse(text);
      } else {
        data = event.data;
      }

      // Process AIS position reports
      if (data.MessageType === "PositionReport" && data.Message?.PositionReport?.UserID) {
        const positionReport = data.Message.PositionReport;
        const mmsi = positionReport.UserID.toString();
        const lat = positionReport.Latitude;
        const lon = positionReport.Longitude;
        const speed = positionReport.Sog || 0;
        const course = positionReport.Cog || 0;

        if (lat && lon && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          const position: Position = {
            lat,
            lon,
            speed,
            course,
            status: positionReport.NavigationalStatus,
            timestamp: new Date().toISOString(),
          };

          console.log(`${LOG_PREFIX} 🛥️ Live update: MMSI ${mmsi} → ${lat.toFixed(4)}°, ${lon.toFixed(4)}° (${speed} kts)`);

          // Find yacht name for better logging
          const yacht = yachtsRef.current.find(y => y.mmsi === mmsi);
          const yachtName = yacht?.name || 'Unknown';
          console.log(`${LOG_PREFIX} 🛥️ Processing update for ${yachtName} (${mmsi})`);

          onLocationUpdate(mmsi, position);
        } else {
          console.log(`${LOG_PREFIX} ⚠️ Invalid coordinates for MMSI ${mmsi}: ${lat}, ${lon}`);
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Message parsing error:`, error);
    }
  }, [onLocationUpdate]);

  // Send subscription when connected
  const sendSubscription = useCallback(() => {
    if (!connectionManager.current || currentVessels.length === 0) {
      return;
    }

    // FIXED: Use exact format from AISStream documentation
    const subscription = {
      Apikey: API_KEY, // NOTE: lowercase 'k' as per documentation!
      BoundingBoxes: [[[-90, -180], [90, 180]]], // Global coverage
      FiltersShipMMSI: currentVessels, // Current batch of vessels
      FilterMessageTypes: ["PositionReport"],
    };

    const success = connectionManager.current.subscribe(subscription);
    if (success) {
      console.log(`${LOG_PREFIX} 📡 Batch ${currentBatch + 1}/${totalBatches} (${currentVessels.length} vessels)`);
      console.log(`${LOG_PREFIX} First 5 MMSIs: ${currentVessels.slice(0, 5).join(', ')}`);
    }
  }, [currentVessels, currentBatch, totalBatches]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      connectionManager.current
    ) {
      console.log(`${LOG_PREFIX} App became active - reconnecting`);
      connectionManager.current.connect();
    }
    appState.current = nextAppState;
  }, []);

  // Initialize WebSocket connection and batch rotation
  useEffect(() => {
    console.log(`${LOG_PREFIX} 🌍 Tracking ${trackedVessels.length} vessels total`);
    console.log(`${LOG_PREFIX} 🔄 Will rotate through ${totalBatches} batches`);

    connectionManager.current = new StableConnectionManager(
      handleMessage,
      sendSubscription
    );

    connectionManager.current.connect();

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      connectionManager.current?.cleanup();
      appStateSubscription.remove();
    };
  }, [handleMessage, sendSubscription, handleAppStateChange]);

  // Rotate batches every 5 minutes
  useEffect(() => {
    if (totalBatches <= 1) return;

    const rotationInterval = setInterval(() => {
      setCurrentBatch((prev) => {
        const nextBatch = (prev + 1) % totalBatches;
        console.log(`${LOG_PREFIX} 🔄 Rotating to batch ${nextBatch + 1}/${totalBatches}`);
        return nextBatch;
      });
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(rotationInterval);
  }, [totalBatches]);

  // Reconnect when batch changes (with proper rate limiting)
  useEffect(() => {
    if (connectionManager.current && currentVessels.length > 0) {
      // Don't send subscription immediately on batch change
      // The connection manager will handle rate limiting
      console.log(`${LOG_PREFIX} 🔄 Batch changed - updating subscription`);

      setTimeout(() => {
        sendSubscription();
      }, 2000); // 2 second delay to avoid rapid-fire subscriptions
    }
  }, [currentBatch, sendSubscription]);

  return null;
};

export default React.memo(WebSocketHandler);
