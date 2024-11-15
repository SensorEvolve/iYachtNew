import React, { useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation";
import { Yacht } from "../Types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";

interface Position {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp?: string;
}

interface Locations {
  [mmsi: string]: Position;
}

type Props = NativeStackScreenProps<RootStackParamList, "Map"> & {
  yachts: Yacht[];
};

const MapScreen: React.FC<Props> = ({ yachts }) => {
  const [locations, setLocations] = useState<Locations>({});
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleLocationUpdate = (mmsi: string, location: Position) => {
    console.log("MapScreen received location update:", { mmsi, location });

    setLocations((prev) => {
      const newLocations = {
        ...prev,
        [mmsi]: {
          ...location,
          timestamp: new Date().toISOString(),
        },
      };

      console.log("Updated locations:", newLocations);

      if (webViewRef.current) {
        const updateScript = `
          console.log('Updating markers with:', ${JSON.stringify(newLocations)});
          window.updateLocations('${JSON.stringify(newLocations)}');
          true;
        `;
        webViewRef.current.injectJavaScript(updateScript);
      } else {
        console.log("WebView ref not available");
      }

      return newLocations;
    });
  };

  const getMapHTML = () => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: #000; }
          .yacht-icon { 
            animation: pulse 2s infinite; 
            transform-origin: center;
            transition: transform 0.3s ease-in-out;
          }
          .yacht-icon-motor { --yacht-color: #00ff00; }
          .yacht-icon-sailing { --yacht-color: #00ffff; }
          .yacht-icon-seized { --yacht-color: #ff0000; }
          @keyframes pulse {
            0% { filter: drop-shadow(0 0 2px var(--yacht-color)); }
            50% { filter: drop-shadow(0 0 10px var(--yacht-color)); }
            100% { filter: drop-shadow(0 0 2px var(--yacht-color)); }
          }
          .yacht-popup {
            background: none;
            color: #fff;
            border: none;
            padding: 4px;
            min-width: 120px;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.7);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            pointer-events: none;
          }
          .yacht-name {
            font-weight: bold;
            color: #fff;
            font-size: 12px;
            margin-bottom: 2px;
            text-align: center;
          }
          .yacht-info {
            font-size: 10px;
            line-height: 1.3;
            text-align: center;
            white-space: nowrap;
          }
          .leaflet-popup-content-wrapper {
            background: none;
            box-shadow: none;
          }
          .leaflet-popup-tip-container {
            display: none;
          }
          .leaflet-popup-content {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          console.log('Map initializing...');
          const map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([25.7617, -80.1918], 4);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: false
          }).addTo(map);

          const markers = {};
          const yachts = ${JSON.stringify(yachts)};

          function getNavigationStatus(status) {
            const statuses = {
              0: "Under way",
              1: "At anchor",
              2: "Not under command",
              3: "Restricted maneuverability",
              4: "Constrained by draught",
              5: "Moored",
              6: "Aground",
              7: "Engaged in fishing",
              8: "Under way sailing",
              15: "Undefined"
            };
            return statuses[status] || "Unknown";
          }

          function getYachtColor(yacht) {
            if (yacht.seizedBy) return '#ff0000';
            return yacht.yachtType.toLowerCase().includes('sail') ? '#00ffff' : '#00ff00';
          }

          function getYachtClass(yacht) {
            if (yacht.seizedBy) return 'seized';
            return yacht.yachtType.toLowerCase().includes('sail') ? 'sailing' : 'motor';
          }

          window.updateLocations = function(data) {
            console.log('Received location update:', data);
            const locations = JSON.parse(data);
            
            Object.entries(locations).forEach(([mmsi, loc]) => {
              const yacht = yachts.find(y => y.mmsi === mmsi);
              if (!yacht || !loc.lat || !loc.lon) {
                console.log('Skipping invalid location:', { mmsi, loc });
                return;
              }

              console.log('Updating yacht position:', { 
                yacht: yacht.name, 
                lat: loc.lat, 
                lon: loc.lon 
              });

              const yachtColor = getYachtColor(yacht);
              const yachtClass = getYachtClass(yacht);

              const icon = L.divIcon({
                className: \`yacht-icon yacht-icon-\${yachtClass}\`,
                html: \`<svg width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(\${loc.course}deg)">
                  <path d="M12 2L18 20H6L12 2z" fill="\${yachtColor}"/>
                  <path d="M9 14h6l-3 6-3-6z" fill="\${yachtColor}" opacity="0.6"/>
                </svg>\`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              });

              const popupContent = \`
                <div class="yacht-popup">
                  <div class="yacht-name">\${yacht.name}</div>
                  <div class="yacht-info">
                    \${yacht.owner}<br>
                    \${loc.speed.toFixed(1)} knots • \${loc.course.toFixed(1)}°<br>
                    \${getNavigationStatus(loc.status)}<br>
                    \${new Date(loc.timestamp).toLocaleString()}
                  </div>
                </div>
              \`;

              if (markers[mmsi]) {
                markers[mmsi].setLatLng([loc.lat, loc.lon]);
                markers[mmsi].setIcon(icon);
                markers[mmsi].getPopup().setContent(popupContent);
              } else {
                console.log('Creating new marker for:', yacht.name);
                markers[mmsi] = L.marker([loc.lat, loc.lon], { icon })
                  .bindPopup(popupContent, {
                    closeButton: false,
                    offset: [0, 5],
                    className: 'yacht-popup-container',
                    autoPan: false,
                    autoClose: false
                  })
                  .addTo(map)
                  .openPopup();
              }
            });
          }

          window.addEventListener('load', function() {
            console.log('Map loaded, sending ready message');
            window.ReactNativeWebView.postMessage('mapReady');
          });

          console.log('Initial map setup complete');
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    if (event.nativeEvent.data === "mapReady") {
      console.log("Map reported ready");
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <WebSocketHandler
        yachts={yachts}
        onLocationUpdate={handleLocationUpdate}
      />
      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML() }}
        style={[styles.map, isLoading && styles.hidden]}
        onLoadEnd={() => console.log("WebView load ended")}
        onMessage={handleWebViewMessage}
        onError={(syntheticEvent) => {
          console.warn("WebView error:", syntheticEvent.nativeEvent);
        }}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      )}
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
  hidden: {
    opacity: 0,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});

export default MapScreen;
