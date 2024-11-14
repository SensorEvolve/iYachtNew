import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation";
import { Yacht } from "../Types/yacht";

interface Position {
  Latitude: number;
  Longitude: number;
  Sog: number;
  Cog: number;
}

interface AISMessage {
  MetaData: {
    MMSI: string;
  };
  Message: {
    PositionReport?: Position;
    StandardClassBPositionReport?: Position;
  };
}

type Props = NativeStackScreenProps<RootStackParamList, "Map"> & {
  yachts: Yacht[];
};

const MapScreen: React.FC<Props> = ({ yachts }) => {
  const [locations, setLocations] = useState<Record<string, any>>({});
  const wsUrl = "wss://stream.aisstream.io/v0/stream";
  const apiKey = "a8437deb4bfa21aa490de22b93bee19dcbb76540";

  useEffect(() => {
    const ws = new WebSocket(wsUrl);
    console.log("Connecting to WebSocket...");

    ws.onopen = () => {
      console.log("WebSocket Connected");
      const mmsiList = yachts.map((yacht) => yacht.mmsi).filter(Boolean);
      console.log("MMSI list:", mmsiList);

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

      console.log("Sending message:", JSON.stringify(message, null, 2));
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      try {
        console.log("Raw WebSocket data type:", typeof event.data);

        if (!event.data) {
          console.log("Empty data received");
          return;
        }

        let data: AISMessage;
        if (typeof event.data === "string") {
          data = JSON.parse(event.data);
        } else if (typeof event.data === "object") {
          data = event.data as AISMessage;
        } else {
          console.error("Unexpected data type:", typeof event.data);
          return;
        }

        if (data?.MetaData?.MMSI) {
          const position =
            data.Message?.PositionReport ||
            data.Message?.StandardClassBPositionReport;
          if (position) {
            console.log("Position update received:", {
              mmsi: data.MetaData.MMSI,
              lat: position.Latitude,
              lon: position.Longitude,
            });
            setLocations((prev) => ({
              ...prev,
              [data.MetaData.MMSI]: {
                lat: position.Latitude,
                lon: position.Longitude,
                speed: position.Sog,
                course: position.Cog,
              },
            }));
          }
        }
      } catch (error) {
        console.error("WebSocket message handling error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      ws.close();
    };
  }, [yachts]);

  const getMapHTML = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; }
          #map { height: 100vh; }
          .leaflet-grid-pane { display: none !important; }
          .leaflet-container { background: #000 !important; }
          .leaflet-control-attribution { display: none !important; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          }).setView([25.7617, -80.1918], 4);
          
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            noWrap: true,
            className: 'map-tiles'
          }).addTo(map);
          
          ${Object.entries(locations)
            .map(([mmsi, loc]) => {
              const yacht = yachts.find((y) => y.mmsi === mmsi);
              if (!yacht || !loc.lat || !loc.lon) return "";
              return `
              L.marker([${loc.lat}, ${loc.lon}])
               .bindPopup("${yacht.name}<br>Speed: ${loc.speed} knots<br>Course: ${loc.course}°")
               .addTo(map);
            `;
            })
            .join("")}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: getMapHTML() }}
        style={styles.map}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error("WebView error:", nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  map: {
    flex: 1,
  },
});

export default MapScreen;
