import { AppState, AppStateStatus } from "react-native";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
// This class is stable and does not need modification.
class ConnectionManager {
  private ws: WebSocket | null = null;
  private reconnectTimeout?: NodeJS.Timeout;
  private currentRetry = 0;
  private readonly baseDelay = 5000;
  private readonly maxDelay = 30000;
  private isConnecting = false;

  constructor(
    private readonly onMessage: (event: any) => void,
    private readonly onConnect: () => void
  ) {}

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
        this.isConnecting = false;
        this.onConnect();
      };
      this.ws.onmessage = this.onMessage;
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
        if (event.code !== 1000) this.scheduleReconnect();
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

  public send(data: unknown): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  public cleanup() {
    this.isConnecting = false;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }
  }
}

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const connectionManager = useRef<ConnectionManager | null>(null);

  const trackedMmsiSet = useMemo(
    () =>
      new Set(
        yachts.map((y) => y.mmsi).filter((mmsi) => mmsi && /^\d+$/.test(mmsi))
      ),
    [yachts]
  );

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) return;

        const positionData =
          data?.Message?.PositionReport ||
          data?.Message?.StandardClassBPositionReport;
        const mmsi = data?.MetaData?.MMSI?.toString();

        if (positionData && mmsi && trackedMmsiSet.has(mmsi)) {
          const timestamp = data.MetaData.time_utc
            ? data.MetaData.time_utc.split(".")[0] + "Z"
            : new Date().toISOString();

          onLocationUpdate(mmsi, {
            lat: positionData.Latitude,
            lon: positionData.Longitude,
            speed: positionData.Sog || 0,
            course: positionData.Cog || 0,
            status: positionData.NavigationalStatus,
            timestamp,
          });
        }
      } catch (e) {
        // Ignore JSON parse errors for non-data messages (like keep-alives)
      }
    },
    [onLocationUpdate, trackedMmsiSet]
  );

  // --- THIS IS THE CORRECTED SUBSCRIPTION LOGIC ---
  const sendSubscription = useCallback(() => {
    if (!connectionManager.current) return;
    if (!apiKey) {
      console.error("❌ [WebSocket] API Key is missing!");
      return;
    }

    const mmsiList = Array.from(trackedMmsiSet);
    console.log(`${LOG_PREFIX} Subscribing to ${mmsiList.length} vessels...`);

    // This is the single, correct message format that works for your key.
    // It does NOT use batching.
    const message = {
      APIKey: apiKey,
      BoundingBoxes: [
        [
          [-90, -180],
          [90, 180],
        ],
      ],
      FiltersShipMMSI: mmsiList,
      FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
    };

    if (connectionManager.current.send(message)) {
      console.log("✅ Subscription sent successfully.");
    } else {
      console.warn("⚠️ Failed to send subscription.");
    }
  }, [trackedMmsiSet]);

  useEffect(() => {
    connectionManager.current = new ConnectionManager(
      handleMessage,
      sendSubscription
    );
    connectionManager.current.connect();
    return () => connectionManager.current?.cleanup();
  }, [handleMessage, sendSubscription]);

  return null;
};

export default React.memo(WebSocketHandler);
