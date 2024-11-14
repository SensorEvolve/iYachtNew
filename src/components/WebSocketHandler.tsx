import { useEffect } from "react";
import { Yacht } from "../Types/yacht";

interface Props {
  yachts: Yacht[];
  onLocationUpdate: (mmsi: string, data: any) => void;
}

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  useEffect(() => {
    const wsUrl = "wss://stream.aisstream.io/v0/stream";
    const apiKey = "a8437deb4bfa21aa490de22b93bee19dcbb76540";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket Connected");
      const message = {
        APIKey: apiKey,
        BoundingBoxes: [
          [
            [-90, -180],
            [90, 180],
          ],
        ],
        FiltersShipMMSI: yachts.map((yacht) => yacht.mmsi).filter(Boolean),
        FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
      };
      console.log("Sending message:", JSON.stringify(message, null, 2));
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      try {
        console.log("Raw data:", event.data);
        const data = JSON.parse(event.data);
        if (data?.MetaData?.MMSI) {
          const position =
            data.Message?.PositionReport ||
            data.Message?.StandardClassBPositionReport;
          if (position) {
            onLocationUpdate(data.MetaData.MMSI, {
              lat: position.Latitude,
              lon: position.Longitude,
              speed: position.Sog,
              course: position.Cog,
            });
          }
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [yachts, onLocationUpdate]);

  return null;
};

export default WebSocketHandler;
