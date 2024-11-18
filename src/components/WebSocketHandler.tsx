import React, { useEffect, useCallback, useRef } from "react";
import { Yacht, YachtLocation } from "../Types/yacht";
import { locationService } from "../services/YachtLocationService";
import { useYachtSelection } from "../contexts/YachtSelectionContext";

interface Props {
  yachts: Yacht[];
  onLocationUpdate: (mmsi: string, data: YachtLocation) => void;
}

const LOG_PREFIX = "🔌 [WebSocket]";

const WebSocketHandler: React.FC<Props> = ({ yachts, onLocationUpdate }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const subscriptionTimeoutRef = useRef<NodeJS.Timeout>();

  const isValidPosition = (position: YachtLocation): boolean => {
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

  const handleMessage = useCallback(
    async (event: { data: string | ArrayBuffer }) => {
      try {
        let data;
        if (event.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder();
          data = JSON.parse(decoder.decode(event.data));
        } else {
          data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        }

        if (data?.Message) {
          const positionData =
            data.Message.PositionReport ||
            data.Message.StandardClassBPositionReport;

          if (positionData && data.MetaData?.MMSI) {
            const timestamp = data.MetaData.time_utc?.split(".")[0] + "Z";

            const position: YachtLocation = {
              mmsi: data.MetaData.MMSI,
              lat: positionData.Latitude,
              lon: positionData.Longitude,
              speed: positionData.Sog || 0,
              course: positionData.Cog || 0,
              status: positionData.NavigationalStatus,
              timestamp: timestamp,
              source: "AIS"
            };

            if (isValidPosition(position)) {
              console.log(
                `${LOG_PREFIX} Valid position update for ${data.MetaData.MMSI}:`,
                `${position.lat}, ${position.lon} at ${position.timestamp}`
              );
              await locationService.updateLocation(data.MetaData.MMSI, position);
              onLocationUpdate(data.MetaData.MMSI, position);
            }
          }
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Message processing error:`, error);
      }
    },
    [onLocationUpdate]
  );

  const sendSubscription = useCallback(() => {
    if (!wsRef.current) {
      console.warn(
        `${LOG_PREFIX} Cannot send subscription - no socket reference`
      );
      return;
    }

    try {
      const mmsiList = yachts
        .map((yacht) => yacht.mmsi)
        .filter((mmsi) => mmsi && /^\d+$/.test(mmsi));

      console.log(`${LOG_PREFIX} Subscribing to ${mmsiList.length} vessels`);

      const message = {
        APIKey: "a8437deb4bfa21aa490de22b93bee19dcbb76540",
        BoundingBoxes: [[[-90, -180], [90, 180]]],
        FiltersShipMMSI: mmsiList,
        FilterMessageTypes: ["PositionReport", "StandardClassBPositionReport"],
      };

      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
        console.log(`${LOG_PREFIX} Subscription sent successfully`);
      } else {
        console.warn(
          `${LOG_PREFIX} Cannot send subscription - connection not ready (state: ${wsRef.current.readyState})`
        );
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to send subscription:`, error);
    }
  }, [yachts]);

  useEffect(() => {
    const MAX_RECONNECT_ATTEMPTS = 5;
    const BASE_DELAY = 5000;
    const SUBSCRIPTION_DELAY = 500;
    let reconnectTimeout: NodeJS.Timeout;

    const cleanup = () => {
      console.log(`${LOG_PREFIX} Cleaning up connection`);
      if (subscriptionTimeoutRef.current) {
        clearTimeout(subscriptionTimeoutRef.current);
        subscriptionTimeoutRef.current = undefined;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    const connect = () => {
      try {
        console.log(
          `${LOG_PREFIX} Creating connection (Attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
        );

        cleanup();

        const wsUrl = "wss://stream.aisstream.io/v0/stream";
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
          console.log(`${LOG_PREFIX} Connected successfully`);
          reconnectAttemptsRef.current = 0;

          subscriptionTimeoutRef.current = setTimeout(() => {
            sendSubscription();
          }, SUBSCRIPTION_DELAY);
        };

        wsRef.current.onmessage = handleMessage;

        wsRef.current.onerror = (error) => {
          console.error(`${LOG_PREFIX} Error:`, error);
        };

        wsRef.current.onclose = (event) => {
          console.log(`${LOG_PREFIX} Connection closed:`, event.code);

          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = Math.min(
              BASE_DELAY * Math.pow(1.5, reconnectAttemptsRef.current),
              30000
            );

            console.log(`${LOG_PREFIX} Reconnecting in ${delay}ms...`);

            reconnectTimeout = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, delay);
          } else {
            console.log(`${LOG_PREFIX} Max reconnection attempts reached`);
          }
        };
      } catch (error) {
        console.error(`${LOG_PREFIX} Connection error:`, error);
      }
    };

    connect();

    return cleanup;
  }, [handleMessage, sendSubscription]);

  return null;
};

export default WebSocketHandler;
