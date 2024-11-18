import React, { useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { Yacht } from "../Types/yacht";

interface Position {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp?: string;
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
  private readonly baseDelay = 5000;
  private readonly maxDelay = 30000;
  private readonly subscriptionDelay = 500;
  private subscriptionTimeout?: NodeJS.Timeout;
  private lastMessageTime?: number;
  private heartbeatInterval?: NodeJS.Timeout;
  private isSubscribed = false;
  private isConnecting = false;

  constructor(
    private readonly onMessage: (event: WebSocketMessageEvent) => void,
    private readonly onConnect: () => void,
  ) {
    this.setupHeartbeat();
  }

  private setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (!this.lastMessageTime) return;

      const now = Date.now();
      const elapsed = now - this.lastMessageTime;

      if (elapsed > 30000 && this.ws && !this.isConnecting) {
        console.log(`${LOG_PREFIX} Connection stale, reconnecting...`);
        this.reconnect();
      }
    }, 10000);
  }

  public connect() {
    if (this.isConnecting) {
      console.log(`${LOG_PREFIX} Connection attempt already in progress`);
      return;
    }

    this.cleanup();
    this.isConnecting = true;

    try {
      console.log(
        `${LOG_PREFIX} Creating connection (Attempt ${this.currentRetry + 1})`,
      );

      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.ws.onopen = () => {
        console.log(`${LOG_PREFIX} Connected successfully`);
        this.currentRetry = 0;
        this.lastMessageTime = Date.now();
        this.isConnecting = false;
        this.isSubscribed = false;

        // Delay subscription to ensure connection is stable
        if (this.subscriptionTimeout) {
          clearTimeout(this.subscriptionTimeout);
        }
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

      this.ws.onerror = (error) => {
        console.error(`${LOG_PREFIX} Error:`, error);
        this.isConnecting = false;
      };

      this.ws.onclose = (event) => {
        console.log(`${LOG_PREFIX} Connection closed: ${event.code}`);
        this.isConnecting = false;
        this.isSubscribed = false;

        // Don't reconnect on normal closure (1000) or if already reconnecting
        if (event.code !== 1000 && !this.reconnectTimeout) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Connection error:`, error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.baseDelay * Math.pow(1.5, this.currentRetry),
      this.maxDelay,
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

  public send(data: any): boolean {
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

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.subscriptionTimeout) {
      clearTimeout(this.subscriptionTimeout);
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.ws) {
      this.ws.close(1000); // Normal closure
      this.ws = null;
    }
  }
}

// Rest of the component remains the same...
const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const connectionManager = useRef<ConnectionManager>();
  const appState = useRef(AppState.currentState);
  const batchedUpdates = useRef<Map<string, Position>>(new Map());
  const batchTimeout = useRef<NodeJS.Timeout>();

  const processBatchedUpdates = useCallback(() => {
    if (batchedUpdates.current.size > 0) {
      batchedUpdates.current.forEach((position, mmsi) => {
        onLocationUpdate(mmsi, position);
      });
      batchedUpdates.current.clear();
    }
  }, [onLocationUpdate]);

  const handleMessage = useCallback(
    (event: WebSocketMessageEvent) => {
      try {
        let data;
        if (event.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder();
          data = JSON.parse(decoder.decode(event.data));
        } else {
          data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
        }

        if (data?.Message) {
          const positionData =
            data.Message.PositionReport ||
            data.Message.StandardClassBPositionReport;

          if (positionData && data.MetaData?.MMSI) {
            const timestamp = data.MetaData.time_utc?.split(".")[0] + "Z";

            const position = {
              lat: positionData.Latitude,
              lon: positionData.Longitude,
              speed: positionData.Sog || 0,
              course: positionData.Cog || 0,
              status: positionData.NavigationalStatus,
              timestamp: timestamp,
            };

            if (isValidPosition(position)) {
              // Add to batch instead of immediate update
              batchedUpdates.current.set(String(data.MetaData.MMSI), position);

              // Clear existing timeout
              if (batchTimeout.current) {
                clearTimeout(batchTimeout.current);
              }

              // Process batch after 100ms of no new updates
              batchTimeout.current = setTimeout(processBatchedUpdates, 100);
            }
          }
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Message processing error:`, error);
      }
    },
    [processBatchedUpdates],
  );

  const isValidPosition = (position: Position): boolean => {
    return (
      typeof position.lat === "number" &&
      typeof position.lon === "number" &&
      !isNaN(position.lat) &&
      !isNaN(position.lon) &&
      position.lat >= -90 &&
      position.lat <= 90 &&
      position.lon >= -180 &&
      position.lon <= 180
    );
  };

  const sendSubscription = useCallback(() => {
    if (!connectionManager.current) return;

    const mmsiList = yachts
      .map((yacht) => yacht.mmsi)
      .filter((mmsi) => mmsi && /^\d+$/.test(mmsi));

    console.log(`${LOG_PREFIX} Subscribing to ${mmsiList.length} vessels`);

    const message = {
      APIKey: "a8437deb4bfa21aa490de22b93bee19dcbb76540",
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
      console.log(`${LOG_PREFIX} Subscription sent successfully`);
    }
  }, [yachts]);

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
    // Initialize connection manager
    connectionManager.current = new ConnectionManager(
      handleMessage,
      sendSubscription,
    );
    connectionManager.current.connect();

    // Setup app state listener
    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      connectionManager.current?.cleanup();
      appStateSubscription.remove();
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
    };
  }, [handleMessage, handleAppStateChange, sendSubscription]);

  return null;
};

export default WebSocketHandler;
