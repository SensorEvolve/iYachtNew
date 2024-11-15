import { useEffect, useCallback } from "react";
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
  const handleMessage = useCallback(
    (event: WebSocketMessageEvent) => {
      try {
        // Log raw message for debugging
        console.log("Raw message:", event.data);
        let data;
        try {
          // Handle array buffer if present
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

        // Log the full parsed data structure
        console.log("Parsed data:", JSON.stringify(data, null, 2));

        // Check the message structure
        if (data?.Message) {
          const positionData =
            data.Message.PositionReport ||
            data.Message.StandardClassBPositionReport;
          if (positionData && data.MetaData?.MMSI) {
            console.log("Found position data:", {
              mmsi: data.MetaData.MMSI,
              position: positionData,
            });
            onLocationUpdate(data.MetaData.MMSI, {
              lat: positionData.Latitude,
              lon: positionData.Longitude,
              speed: positionData.Sog || 0,
              course: positionData.Cog || 0,
              status: positionData.NavigationalStatus,
              timestamp: data.MetaData.time_utc || new Date().toISOString(),
            });
          }
        } else {
          console.log("Message structure:", Object.keys(data || {}));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        console.log("Message type:", typeof event.data);
        if (event.data instanceof ArrayBuffer) {
          console.log("ArrayBuffer received");
        }
      }
    },
    [onLocationUpdate],
  );

  useEffect(() => {
    const wsUrl = "wss://stream.aisstream.io/v0/stream";
    const apiKey = "a8437deb4bfa21aa490de22b93bee19dcbb76540";
    console.log("Creating WebSocket connection...");
    const ws = new WebSocket(wsUrl);
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      ws.onopen = () => {
        console.log("WebSocket Connected");
        const mmsiList = yachts
          .map((yacht) => yacht.mmsi)
          .filter((mmsi) => mmsi && /^\d+$/.test(mmsi));
        console.log(`Subscribing to ${mmsiList.length} MMSIs`);

        const message = {
          APIKey: apiKey,
          BoundingBoxes: [
            [
              [-90, -180],
              [90, 180],
            ],
          ],
          FiltersShipMMSI: mmsiList,
          FilterMessageTypes: [
            "PositionReport",
            "StandardClassBPositionReport",
          ],
        };
        console.log("Sending subscription:", message);
        ws.send(JSON.stringify(message));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        // Attempt to reconnect after 5 seconds
        reconnectTimeout = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, 5000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws.close();
    };
  }, [yachts, handleMessage]);

  return null;
};

export default WebSocketHandler;
