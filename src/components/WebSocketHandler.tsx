import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Yacht } from "../types/yacht";

// Use the exact same API key from your working Python code
const API_KEY = "a8437deb4bfa21aa490de22b93bee19dcbb76540";

// React Native WebSocket message event interface
interface RNWebSocketEvent {
  data: string | ArrayBuffer | Blob;
  type: string;
  target?: WebSocket;
}

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

class PythonStyleConnectionManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout?: NodeJS.Timeout;
  private currentRetry = 0;
  private readonly baseDelay = 1000;
  private readonly maxDelay = 30000;
  private isConnecting = false;
  private pingInterval?: NodeJS.Timeout;

  constructor(
    private readonly onMessage: (event: RNWebSocketEvent) => void,
    private readonly onConnect: () => void
  ) {}

  public connect() {
    if (this.isConnecting) return;

    this.cleanup();
    this.isConnecting = true;

    console.log(`${LOG_PREFIX} Connecting (attempt ${this.currentRetry + 1})`);

    try {
      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.ws.onopen = () => {
        console.log(
          `${LOG_PREFIX} ✅ Connected - tracking luxury yachts globally`
        );
        this.currentRetry = 0;
        this.isConnecting = false;
        this.startPingInterval();

        // Delay to ensure WebSocket is fully ready
        setTimeout(() => {
          this.onConnect();
        }, 200);
      };

      this.ws.onmessage = this.onMessage;

      this.ws.onerror = (error) => {
        console.error(`${LOG_PREFIX} Connection error`);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.stopPingInterval();

        if (event.code !== 1000) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      // Keep connection alive
    }, 20000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;

    const delay = Math.min(
      this.baseDelay * Math.pow(2, Math.min(this.currentRetry, 4)),
      this.maxDelay
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = undefined;
      this.currentRetry++;
      this.connect();
    }, delay);
  }

  public send(data: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        return true;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  public cleanup() {
    this.isConnecting = false;
    this.stopPingInterval();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close(1000, "Component unmounting");
      this.ws = null;
    }
  }
}

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const connectionManager = useRef<PythonStyleConnectionManager | null>(null);
  const appState = useRef(AppState.currentState);
  const updateCount = useRef(0);

  // Get list of MMSI numbers exactly like Python
  const trackedVessels = useMemo(() => {
    const vessels: { [key: string]: string } = {};

    yachts.forEach((yacht) => {
      if (
        yacht.mmsi &&
        yacht.mmsi.trim() !== "" &&
        yacht.mmsi.toLowerCase() !== "none" &&
        yacht.name
      ) {
        vessels[yacht.mmsi] = yacht.name;
      }
    });

    console.log(
      `${LOG_PREFIX} Monitoring ${Object.keys(vessels).length} luxury yachts`
    );

    return vessels;
  }, [yachts]);

  // Clean message handler - only essential logging
  const handleMessage = useCallback(
    (event: RNWebSocketEvent) => {
      try {
        let data: any;

        // Handle both string and pre-parsed object data
        if (typeof event.data === "string") {
          const messageData = event.data.trim();
          if (!messageData.startsWith("{") && !messageData.startsWith("[")) {
            return; // Skip heartbeat messages
          }
          data = JSON.parse(messageData);
        } else if (typeof event.data === "object" && event.data !== null) {
          data = event.data;
        } else {
          return;
        }

        // Skip non-position messages
        if (Array.isArray(data) || !data.Message) {
          return;
        }

        const messageType = data.MessageType;

        if (
          !messageType ||
          !["PositionReport", "StandardClassBPositionReport"].includes(
            messageType
          )
        ) {
          return;
        }

        const metaData = data.MetaData || {};
        const mmsi = String(metaData.MMSI || "");

        if (!mmsi || !trackedVessels[mmsi]) {
          return;
        }

        // Get position data using Python's structure
        const positionData = data.Message?.[messageType] || {};

        const lat = positionData.Latitude;
        const lon = positionData.Longitude;

        if (!lat || !lon) {
          return;
        }

        const speed = positionData.Sog || 0;
        const course = positionData.Cog || 0;
        const status = positionData.NavigationalStatus;
        const timestamp = metaData.time_utc
          ? metaData.time_utc.split(".")[0] + "Z"
          : new Date().toISOString();

        const position: Position = {
          lat,
          lon,
          speed,
          course,
          status,
          timestamp,
        };

        updateCount.current++;

        // Clean, essential logging for yacht updates
        const locationStr = `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
        const speedStr = speed > 0 ? ` (${speed.toFixed(1)} kn)` : "";

        console.log(
          `🛥️ ${trackedVessels[mmsi]} → ${locationStr}${speedStr} [${updateCount.current}]`
        );

        onLocationUpdate(mmsi, position);
      } catch (error) {
        // Silent error handling - only log if it's a real parsing issue
      }
    },
    [onLocationUpdate, trackedVessels]
  );

  // Clean subscription with essential logging
  const sendSubscription = useCallback(() => {
    if (!connectionManager.current) return;

    if (!API_KEY) {
      console.error(`${LOG_PREFIX} Missing API key`);
      return;
    }

    const mmsiList = Object.keys(trackedVessels);

    if (mmsiList.length === 0) {
      console.warn(`${LOG_PREFIX} No vessels to track`);
      return;
    }

    const subscriptionMessage = {
      APIKey: API_KEY,
      BoundingBoxes: [
        [
          [-90, -180],
          [90, 180],
        ],
      ],
      FiltersShipMMSI: mmsiList,
      FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
    };

    if (connectionManager.current.send(subscriptionMessage)) {
      console.log(`${LOG_PREFIX} 📡 Subscribed to ${mmsiList.length} vessels`);
    } else {
      // Will retry with reconnection
    }
  }, [trackedVessels]);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active" &&
      connectionManager.current
    ) {
      connectionManager.current.connect();
    }

    appState.current = nextAppState;
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    console.log(`${LOG_PREFIX} Starting yacht tracker`);

    connectionManager.current = new PythonStyleConnectionManager(
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
    };
  }, [handleMessage, sendSubscription, handleAppStateChange]);

  return null;
};

export default React.memo(WebSocketHandler);
