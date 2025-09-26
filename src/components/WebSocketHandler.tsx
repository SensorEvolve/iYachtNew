import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Yacht } from "../types/yacht";

// Use exact API key like Python
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

class ConnectionManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout?: NodeJS.Timeout;
  private currentRetry = 0;
  private baseDelay = 1;
  private maxDelay = 30;
  private isRunning = true;
  private subscriptionSent = false;

  constructor(
    private readonly onMessage: (event: any) => void,
    private readonly onConnect: () => void
  ) {}

  public async connect() {
    if (!this.isRunning) return;

    this.subscriptionSent = false;

    try {
      console.log(
        `${LOG_PREFIX} Connecting (attempt ${this.currentRetry + 1})`
      );

      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.ws.onopen = () => {
        console.log(
          `${LOG_PREFIX} ✅ Connected - sending subscription immediately`
        );
        this.currentRetry = 0;

        // CRITICAL: Send subscription within 3 seconds per AIS Stream docs
        setTimeout(() => {
          if (!this.subscriptionSent) {
            this.onConnect();
          }
        }, 100); // Send subscription after 100ms
      };

      this.ws.onmessage = this.onMessage;

      this.ws.onerror = (error) => {
        console.error(`${LOG_PREFIX} Connection error:`, error);
      };

      this.ws.onclose = (event) => {
        console.log(`${LOG_PREFIX} Connection closed (code: ${event.code})`);
        this.subscriptionSent = false;

        if (this.isRunning) {
          this.currentRetry++;
          const delay =
            Math.min(
              this.baseDelay * Math.pow(2, Math.min(this.currentRetry, 4)),
              this.maxDelay
            ) * 1000;

          console.log(`${LOG_PREFIX} Reconnecting in ${delay / 1000}s...`);

          this.reconnectTimeout = setTimeout(() => {
            if (this.isRunning) {
              this.connect();
            }
          }, delay);
        }
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Connection error:`, error);
      if (this.isRunning) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    this.currentRetry++;
    const delay =
      Math.min(
        this.baseDelay * Math.pow(2, Math.min(this.currentRetry, 4)),
        this.maxDelay
      ) * 1000;

    this.reconnectTimeout = setTimeout(() => {
      if (this.isRunning) {
        this.connect();
      }
    }, delay);
  }

  public send(data: any): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
        this.subscriptionSent = true;
        return true;
      } catch (error) {
        console.error(`${LOG_PREFIX} Send error:`, error);
        return false;
      }
    }
    return false;
  }

  public cleanup() {
    this.isRunning = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const connectionManager = useRef<ConnectionManager | null>(null);
  const appState = useRef(AppState.currentState);
  const vesselsStatus = useRef<{ [mmsi: string]: any }>({});
  const messageCounts = useRef<{ [mmsi: string]: number }>({});

  // Load vessels with 50 MMSI limit per AIS Stream docs
  const trackedVessels = useMemo(() => {
    const vessels: { [key: string]: string } = {};

    yachts.forEach((yacht, index) => {
      const mmsi = yacht.mmsi;
      const name = yacht.name;

      // LIMIT TO 50 VESSELS per AIS Stream documentation
      if (
        index < 50 &&
        mmsi &&
        mmsi.trim() !== "" &&
        mmsi.toLowerCase() !== "none" &&
        name
      ) {
        vessels[mmsi] = name;
        messageCounts.current[mmsi] = 0;
        console.log(
          `${LOG_PREFIX} Added vessel ${index + 1}/50: ${name} (MMSI: ${mmsi})`
        );
      }
    });

    console.log(
      `${LOG_PREFIX} ✅ Loaded ${
        Object.keys(vessels).length
      }/50 vessels (AIS Stream limit)`
    );
    return vessels;
  }, [yachts]);

  // Subscribe with proper formatting per AIS Stream docs
  const subscribe = useCallback(async () => {
    if (!connectionManager.current) return;

    const mmsiArray = Object.keys(trackedVessels);

    // Use exact subscription format from AIS Stream documentation
    const subscribeMessage = {
      APIKey: API_KEY,
      BoundingBoxes: [
        [
          [-90, -180],
          [90, 180],
        ],
      ], // Global coverage like your Python
      FiltersShipMMSI: mmsiArray, // Maximum 50 MMSIs
      FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
    };

    console.log(
      `${LOG_PREFIX} 📡 Subscription (${mmsiArray.length}/50 vessels):`
    );
    console.log(
      `${LOG_PREFIX} First 5 MMSIs: ${mmsiArray.slice(0, 5).join(", ")}`
    );

    const success = connectionManager.current.send(subscribeMessage);
    if (success) {
      console.log(`${LOG_PREFIX} ✅ Subscription sent within 3-second limit`);
    } else {
      console.error(`${LOG_PREFIX} ❌ Failed to send subscription`);
    }
  }, [trackedVessels]);

  // Process message exactly like Python
  const processMessage = useCallback(
    async (data: any) => {
      try {
        const msgType = data.MessageType;
        if (
          !["PositionReport", "StandardClassBPositionReport"].includes(msgType)
        ) {
          return;
        }

        const meta = data.MetaData || {};
        const mmsi = String(meta.MMSI || "");

        if (mmsi && trackedVessels[mmsi]) {
          messageCounts.current[mmsi] = (messageCounts.current[mmsi] || 0) + 1;
        }

        if (!mmsi || !trackedVessels[mmsi]) {
          return;
        }

        const positionData = data.Message?.[msgType] || {};
        const lat = positionData.Latitude;
        const lon = positionData.Longitude;

        if (!lat || !lon) {
          return;
        }

        const speed = positionData.Sog || 0;
        const course = positionData.Cog || 0;
        const status = positionData.NavigationalStatus || 15;
        const timestamp = meta.time_utc || new Date().toISOString();

        vesselsStatus.current[mmsi] = {
          last_position: { lat, lon },
          speed,
          course,
          status,
          last_update: timestamp,
        };

        const statusDesc: { [key: number]: string } = {
          0: "Under way using engine",
          1: "At anchor",
          2: "Not under command",
          3: "Restricted maneuverability",
          4: "Constrained by draught",
          5: "Moored",
          6: "Aground",
          7: "Engaged in fishing",
          8: "Under way sailing",
          15: "Undefined",
        };

        console.log(`
╔═══════════════ VESSEL UPDATE ════════════════╗
║ 🚢 ${trackedVessels[mmsi]}
║ 🔍 MMSI: ${mmsi}
║ 📍 Position: ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E
║ ⚡ Speed: ${speed} knots
║ 🧭 Course: ${course}°
║ 🚩 Status: ${statusDesc[status] || "Unknown"}
║ 📊 Updates received: ${messageCounts.current[mmsi]}
║ ⏰ ${timestamp}
╚══════════════════════════════════════════════╝`);

        const position: Position = {
          lat,
          lon,
          speed,
          course,
          status,
          timestamp,
        };

        onLocationUpdate(mmsi, position);
      } catch (error) {
        console.log(`${LOG_PREFIX} ⚠️ Error processing vessel data:`, error);
      }
    },
    [trackedVessels, onLocationUpdate]
  );

  // Handle message exactly like Python
  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.data);
        processMessage(data);
      } catch (error) {
        // Silently continue like Python
      }
    },
    [processMessage]
  );

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      connectionManager.current?.connect();
    }
    appState.current = nextAppState;
  }, []);

  // Start exactly like Python but respecting AIS Stream limits
  useEffect(() => {
    console.log(
      `${LOG_PREFIX} 🚢 Global Vessel Tracker (Limited to 50 vessels)`
    );
    console.log(
      `${LOG_PREFIX} 🌍 Tracking ${
        Object.keys(trackedVessels).length
      } vessels (AIS Stream limit: 50)`
    );

    connectionManager.current = new ConnectionManager(handleMessage, subscribe);

    connectionManager.current.connect();

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      console.log(`${LOG_PREFIX} 👋 Shutting down gracefully...`);
      connectionManager.current?.cleanup();
      appStateSubscription.remove();
    };
  }, [handleMessage, subscribe, handleAppStateChange, trackedVessels]);

  return null;
};

export default React.memo(WebSocketHandler);
