import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation";
import { Yacht } from "../Types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";
import { locationService } from "../services/YachtLocationService";

// Types
interface Position {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp?: string;
  source?: "MANUAL" | "AIS";
}

interface Locations {
  [mmsi: string]: Position;
}

type Props = NativeStackScreenProps<RootStackParamList, "Map"> & {
  yachts: Yacht[];
};

const LOG_PREFIX = "🗺️ [MapScreen]";

// Map configuration
const MAP_CONFIG = {
  initialView: {
    lat: 25.7617,
    lon: -80.1918,
    zoom: 4,
  },
  tileLayer: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  statusCodes: {
    0: "Under way",
    1: "At anchor",
    2: "Not under command",
    3: "Restricted maneuverability",
    4: "Constrained by draught",
    5: "Moored",
    6: "Aground",
    7: "Engaged in fishing",
    8: "Under way sailing",
    15: "Undefined",
  },
};

// Helper function to safely escape JSON
const escapeString = (str: string) => {
  return str
    .replace(/[\\]/g, "\\\\")
    .replace(/[\"]/g, '\\"')
    .replace(/[\/]/g, "\\/")
    .replace(/[\b]/g, "\\b")
    .replace(/[\f]/g, "\\f")
    .replace(/[\n]/g, "\\n")
    .replace(/[\r]/g, "\\r")
    .replace(/[\t]/g, "\\t");
};

const MapScreen: React.FC<Props> = ({ yachts }) => {
  const [locations, setLocations] = useState<Locations>({});
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadInitialLocations = async () => {
      try {
        await locationService.waitForInitialization();
        const storedLocations = locationService.getLocations();

        const initialLocations: Locations = storedLocations.reduce(
          (acc, loc) => ({
            ...acc,
            [loc.mmsi]: {
              lat: loc.lat,
              lon: loc.lon,
              speed: loc.speed,
              course: loc.course,
              status: loc.status || 5,
              timestamp: loc.timestamp,
              source: loc.source,
            },
          }),
          {},
        );

        setLocations(initialLocations);
        updateMap(initialLocations);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error loading locations:`, error);
      }
    };

    loadInitialLocations();
  }, []);

  const handleLocationUpdate = async (mmsi: string, location: Position) => {
    try {
      const newLocations: Locations = {
        ...locations,
        [mmsi]: {
          ...location,
          source: "AIS",
          timestamp: location.timestamp || new Date().toISOString(),
        },
      };

      setLocations(newLocations);
      updateMap(newLocations);
      await locationService.updateLocation(mmsi, location);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error updating location:`, error);
    }
  };

  const updateMap = (newLocations: Locations) => {
    if (webViewRef.current) {
      try {
        const safeLocations = JSON.stringify(newLocations);
        const script = `
          try {
            window.updateLocations('${escapeString(safeLocations)}');
          } catch(e) {
            console.error('Error in updateLocations:', e);
          }
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error preparing update:`, error);
      }
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      if (event.nativeEvent.data === "mapReady") {
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "yacht_selected") {
        console.log(`${LOG_PREFIX} Yacht selected:`, data.mmsi);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Message error:`, error);
    }
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
          .yacht-icon { animation: pulse 2s infinite; }
          .yacht-icon-motor { --color: #00ff00; }
          .yacht-icon-sailing { --color: #00ffff; }
          .yacht-icon-seized { --color: #ff0000; }
          .yacht-popup {
            color: #fff;
            text-shadow: 0 0 10px rgba(255,255,255,0.7);
            text-align: center;
            min-width: 150px;
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu;
          }
          .manual-source {
            color: #ffd700;
            font-style: italic;
          }
          @keyframes pulse {
            0%, 100% { filter: drop-shadow(0 0 2px var(--color)); }
            50% { filter: drop-shadow(0 0 10px var(--color)); }
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([${MAP_CONFIG.initialView.lat}, ${MAP_CONFIG.initialView.lon}], ${MAP_CONFIG.initialView.zoom});

          L.tileLayer('${MAP_CONFIG.tileLayer}', { attribution: false }).addTo(map);

          const markers = {};
          const yachts = ${JSON.stringify(yachts)};
          const statusCodes = ${JSON.stringify(MAP_CONFIG.statusCodes)};

          function sanitizeHtml(str) {
            return String(str)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#39;');
          }

          window.updateLocations = function(data) {
            try {
              const locations = typeof data === 'string' ? JSON.parse(data) : data;
              
              Object.entries(locations).forEach(([mmsi, loc]) => {
                const yacht = yachts.find(y => y.mmsi === mmsi);
                if (!yacht || !loc.lat || !loc.lon) return;

                const color = yacht.seizedBy ? '#ff0000' : 
                             yacht.yachtType.toLowerCase().includes('sail') ? '#00ffff' : '#00ff00';

                const html = \`
                  <div class="yacht-popup">
                    <strong>\${sanitizeHtml(yacht.name)}</strong><br>
                    \${sanitizeHtml(yacht.owner)}<br>
                    \${loc.speed.toFixed(1)} knots • \${loc.course.toFixed(1)}°<br>
                    \${loc.source === "MANUAL" ? "Moored" : statusCodes[loc.status] || "Unknown"}<br>
                    \${loc.source === "MANUAL" ? "Last seen: " : ""}\${new Date(loc.timestamp).toLocaleString()}<br>
                    \${loc.source === "MANUAL" ? '<span class="manual-source">Manual position</span>' : ''}
                  </div>
                \`;

                if (markers[mmsi]) {
                  markers[mmsi].setLatLng([loc.lat, loc.lon]);
                  markers[mmsi].getPopup().setContent(html);
                } else {
                  markers[mmsi] = L.marker([loc.lat, loc.lon])
                    .bindPopup(html, {
                      className: 'yacht-popup-wrapper',
                      closeButton: false,
                    })
                    .addTo(map)
                    .openPopup();
                }
              });
            } catch(e) {
              console.error('Error processing locations:', e);
            }
          };

          window.addEventListener('error', function(e) {
            console.error('JavaScript error:', e.message);
          });

          window.ReactNativeWebView.postMessage('mapReady');
        </script>
      </body>
    </html>
  `;

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
        onMessage={handleWebViewMessage}
        onError={(error) =>
          console.warn(`${LOG_PREFIX} WebView error:`, error.nativeEvent)
        }
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});

export default MapScreen;
