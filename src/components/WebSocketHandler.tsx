import { useEffect, useCallback, useRef } from "react";
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

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);

  const handleMessage = useCallback(
    (event: WebSocketMessageEvent) => {
      try {
        console.log("Raw message:", event.data);
        let data;

        try {
          if (event.data instanceof ArrayBuffer) {
            const decoder = new TextDecoder();
            data = JSON.parse(decoder.decode(event.data));
          } else {
            data =
              typeof event.data === "string"
                ? JSON.parse(event.data)
                : event.data;
          }
        } catch (parseError) {
          console.error("Parse error:", parseError);
          return;
        }

        // Handle error messages from the server
        if (data?.error) {
          console.error("Server error:", data.error);
          if (data.error === "concurrent connections per user exceeded") {
            // Force close and wait longer before reconnecting
            if (wsRef.current) {
              wsRef.current.close();
              reconnectDelay.current = Math.min(
                reconnectDelay.current * 2,
                30000,
              );
            }
            return;
          }
        }

        if (data?.Message) {
          const positionData =
            data.Message.PositionReport ||
            data.Message.StandardClassBPositionReport;

          if (positionData && data.MetaData?.MMSI) {
            onLocationUpdate(data.MetaData.MMSI, {
              lat: positionData.Latitude,
              lon: positionData.Longitude,
              speed: positionData.Sog || 0,
              course: positionData.Cog || 0,
              status: positionData.NavigationalStatus,
              timestamp: data.MetaData.time_utc || new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    },
    [onLocationUpdate],
  );

  const connect = useCallback(() => {
    if (
      isConnectingRef.current ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      console.log("Connection already in progress or established");
      return;
    }

    isConnectingRef.current = true;
    const wsUrl = "wss://stream.aisstream.io/v0/stream";
    const apiKey = "a8437deb4bfa21aa490de22b93bee19dcbb76540";

    console.log(
      `Creating WebSocket connection (attempt ${reconnectAttemptsRef.current + 1})...`,
    );
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket Connected");
      isConnectingRef.current = false;
      reconnectAttemptsRef.current = 0;
      reconnectDelay.current = 1000; // Reset delay on successful connection

      const mmsiList = yachts
        .map((yacht) => yacht.mmsi)
        .filter((mmsi) => mmsi && /^\d+$/.test(mmsi));

      console.log(`Subscribing to ${mmsiList.length} MMSIs`);

      // Split MMSIs into smaller batches if needed
      const batchSize = 50;
      const mmsiGroups = [];
      for (let i = 0; i < mmsiList.length; i += batchSize) {
        mmsiGroups.push(mmsiList.slice(i, i + batchSize));
      }

      const message = {
        APIKey: apiKey,
        BoundingBoxes: [
          [
            [-90, -180],
            [90, 180],
          ],
        ],
        FiltersShipMMSI: mmsiGroups[0], // Start with first batch
        FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
      };

      ws.send(JSON.stringify(message));
    };

    ws.onmessage = handleMessage;

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      isConnectingRef.current = false;
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event.code, event.reason);
      wsRef.current = null;
      isConnectingRef.current = false;

      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log(
          `Attempting to reconnect in ${reconnectDelay.current}ms...`,
        );
        reconnectAttemptsRef.current++;

        setTimeout(connect, reconnectDelay.current);
      } else {
        console.log("Max reconnection attempts reached");
        // Reset for next connection attempt
        reconnectAttemptsRef.current = 0;
        reconnectDelay.current = 1000;
      }
    };
  }, [yachts, handleMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, [connect]);

  return null;
};

export default WebSocketHandler;
