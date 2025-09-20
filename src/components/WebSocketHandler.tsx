import { AppState, AppStateStatus } from "react-native";
import React, { useCallback, useEffect, useRef } from "react";
import { Yacht } from "../types/yacht";

const apiKey = process.env.EXPO_PUBLIC_AISSTREAM_API_KEY;

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

// --- ConnectionManager Class (No Changes) ---
class ConnectionManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout?: NodeJS.Timeout;
  private currentRetry = 0;
  private readonly baseDelay = 5000;
  private readonly maxDelay = 30000;
  private readonly subscriptionDelay = 500;
  private subscriptionTimeout?: NodeJS.Timeout;
  private lastMessageTime?: number;
  private heartbeatInterval?: NodeJS.Timeout;
  private isSubscribed = false;
  private isConnecting = false;

  constructor(
    private readonly onMessage: (event: any) => void,
    private readonly onConnect: () => void
  ) {
    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (!this.lastMessageTime) return;
      const elapsed = Date.now() - this.lastMessageTime;
      if (elapsed > 30000 && this.ws && !this.isConnecting) {
        console.log(`${LOG_PREFIX} Connection stale, reconnecting...`);
        this.reconnect();
      }
    }, 10000);
  }

  public connect() {
    if (this.isConnecting) return;
    this.cleanup();
    this.isConnecting = true;
    try {
      console.log(
        `${LOG_PREFIX} Creating connection (Attempt ${this.currentRetry + 1})`
      );
      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");
      this.ws.onopen = () => {
        console.log(`${LOG_PREFIX} Connected successfully`);
        this.currentRetry = 0;
        this.lastMessageTime = Date.now();
        this.isConnecting = false;
        this.isSubscribed = false;
        if (this.subscriptionTimeout) clearTimeout(this.subscriptionTimeout);
        this.subscriptionTimeout = setTimeout(() => {
          if (!this.isSubscribed) {
            this.onConnect();
            this.isSubscribed = true;
          }
        }, this.subscriptionDelay);
      };
      this.ws.onmessage = (event) => {
        this.lastMessageTime = Date.now();
        this.onMessage(event);
      };
      this.ws.onerror = (error: any) => {
        console.error(
          `${LOG_PREFIX} Error:`,
          error.message || "A WebSocket error occurred"
        );
        this.isConnecting = false;
      };
      this.ws.onclose = (event: any) => {
        console.log(`${LOG_PREFIX} Connection closed: ${event.code}`);
        this.isConnecting = false;
        this.isSubscribed = false;
        if (event.code !== 1000 && !this.reconnectTimeout)
          this.scheduleReconnect();
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Connection error:`, error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    const delay = Math.min(
      this.baseDelay * Math.pow(1.5, this.currentRetry),
      this.maxDelay
    );
    console.log(`${LOG_PREFIX} Reconnecting in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => {
      this.currentRetry++;
      this.connect();
    }, delay);
  }

  public reconnect() {
    if (!this.isConnecting) {
      this.cleanup();
      this.connect();
    }
  }

  public send(data: unknown): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`${LOG_PREFIX} Send error:`, error);
        return false;
      }
    }
    return false;
  }

  public cleanup() {
    this.isConnecting = false;
    this.isSubscribed = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.subscriptionTimeout) clearTimeout(this.subscriptionTimeout);
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }
  }
}

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const connectionManager = useRef<ConnectionManager | null>(null);
  const appState = useRef(AppState.currentState);
  const batchedUpdates = useRef<Map<string, Position>>(new Map());
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Create a stable reference to the list of tracked MMSIs
  const trackedMmsiSet = useRef(new Set<string>());
  useEffect(() => {
    trackedMmsiSet.current = new Set(yachts.map((y) => y.mmsi).filter(Boolean));
  }, [yachts]);

  const processBatchedUpdates = useCallback(() => {
    if (batchedUpdates.current.size > 0) {
      batchedUpdates.current.forEach((position, mmsi) => {
        onLocationUpdate(mmsi, position);
      });
      batchedUpdates.current.clear();
    }
  }, [onLocationUpdate]);

  const isValidPosition = (position: Position): boolean =>
    typeof position.lat === "number" &&
    !isNaN(position.lat) &&
    typeof position.lon === "number" &&
    !isNaN(position.lon) &&
    position.lat >= -90 &&
    position.lat <= 90 &&
    position.lon >= -180 &&
    position.lon <= 180;

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data) && data.length === 0) return;

        if (data?.Message) {
          const positionData =
            data.Message.PositionReport ||
            data.Message.StandardClassBPositionReport;
          if (positionData && data.MetaData?.MMSI) {
            const mmsi = String(data.MetaData.MMSI);

            // Client-side filter: only process if the MMSI is in our tracked set
            if (!trackedMmsiSet.current.has(mmsi)) {
              return;
            }

            const timestamp = data.MetaData.time_utc
              ? data.MetaData.time_utc.split(".")[0] + "Z"
              : new Date().toISOString();

            const position: Position = {
              lat: positionData.Latitude,
              lon: positionData.Longitude,
              speed: positionData.Sog || 0,
              course: positionData.Cog || 0,
              status: positionData.NavigationalStatus,
              timestamp,
            };

            if (isValidPosition(position)) {
              batchedUpdates.current.set(mmsi, position);
              if (batchTimeout.current) clearTimeout(batchTimeout.current);
              batchTimeout.current = setTimeout(processBatchedUpdates, 100);
            }
          }
        }
      } catch (error) {
        // This is expected for keep-alive messages like '[]'
      }
    },
    [processBatchedUpdates]
  );

  // --- THIS IS THE FINAL VERSION OF THE SUBSCRIPTION LOGIC ---
  const sendSubscription = useCallback(() => {
    if (!connectionManager.current) return;
    if (!apiKey) {
      console.error("❌ [WebSocket] API Key is missing! Check .env file.");
      return;
    }

    const mmsiList = yachts
      .map((yacht) => yacht.mmsi)
      .filter((mmsi) => mmsi && /^\d+$/.test(mmsi));

    if (mmsiList.length === 0) {
      console.warn("⚠️ [WebSocket] No valid MMSIs to subscribe to.");
      return;
    }

    console.log(`${LOG_PREFIX} Total valid MMSIs to track: ${mmsiList.length}`);

    const BATCH_SIZE = 50;
    let i = 0;

    const sendBatch = () => {
      if (i >= mmsiList.length) {
        console.log(`${LOG_PREFIX} ✅ All subscription batches sent.`);
        return;
      }

      const batch = mmsiList.slice(i, i + BATCH_SIZE);

      // This message format now EXACTLY matches your working Python script
      const message = {
        APIKey: apiKey,
        BoundingBoxes: [
          [
            [-90, -180],
            [90, 180],
          ],
        ], // Global Bounding Box
        FiltersShipMMSI: batch, // List of MMSIs for this batch
        FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
      };

      console.log(
        `${LOG_PREFIX} Subscribing to batch ${
          Math.floor(i / BATCH_SIZE) + 1
        }... (${batch.length} vessels)`
      );
      if (connectionManager.current?.send(message)) {
        console.log(`${LOG_PREFIX} Batch subscription sent.`);
      } else {
        console.warn(`${LOG_PREFIX} Failed to send batch subscription.`);
      }

      i += BATCH_SIZE;
      setTimeout(sendBatch, 500); // 500ms delay between batches
    };

    sendBatch();
  }, [yachts]); // Dependency on yachts is correct

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active" &&
      connectionManager.current
    ) {
      console.log(`${LOG_PREFIX} App foregrounded, reconnecting...`);
      connectionManager.current.reconnect();
    }
    appState.current = nextAppState;
  }, []);

  useEffect(() => {
    connectionManager.current = new ConnectionManager(
      handleMessage,
      sendSubscription
    );
    connectionManager.current.connect();
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => {
      connectionManager.current?.cleanup();
      appStateSubscription.remove();
      if (batchTimeout.current) clearTimeout(batchTimeout.current);
    };
  }, [handleMessage, handleAppStateChange, sendSubscription]);

  return null;
};

export default WebSocketHandler;
