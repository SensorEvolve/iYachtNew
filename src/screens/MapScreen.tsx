import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootTabParamList } from "../types/NavigationParams";
import { Yacht } from "../types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";
import { locationService } from "../services/YachtLocationService";

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

type Props = NativeStackScreenProps<RootTabParamList, "HomeTab"> & {
  yachts: Yacht[];
  navigation: any; // Add navigation to props
};

const LOG_PREFIX = "🗺️ [MapScreen]";
const MAP_CONFIG = {
  initialView: {
    lat: 42.57429,
    lon: 17.19905,
    zoom: 4,
  },
  tileLayer:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
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

const MapScreen: React.FC<Props> = ({ route, yachts, navigation }) => {
  const [locations, setLocations] = useState<Locations>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadInitialLocations = async () => {
      try {
        await locationService.waitForInitialization();
        const storedLocations = locationService.getLocations();
        const initialLocations: Locations = storedLocations.reduce(
          (acc, loc) => ({
            ...acc,
            [loc.mmsi]: { ...loc },
          }),
          {}
        );
        setLocations(initialLocations);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error loading locations:`, error);
      }
    };
    loadInitialLocations();
  }, []);

  useEffect(() => {
    if (isMapReady && Object.keys(locations).length > 0) {
      updateMap(locations);

      const mmsiToFocus = route.params?.focusedMmsi;
      if (mmsiToFocus) {
        setTimeout(() => {
          const focusScript = `window.focusOnYacht('${mmsiToFocus}'); true;`;
          webViewRef.current?.injectJavaScript(focusScript);
          // Clear the param so it doesn't re-focus on every re-render
          navigation.setParams({ focusedMmsi: undefined });
        }, 500);
      }
    }
  }, [isMapReady, locations, route.params?.focusedMmsi]);

  const handleLocationUpdate = async (mmsi: string, location: Position) => {
    setLocations((prev) => ({
      ...prev,
      [mmsi]: {
        ...location,
        source: "AIS",
        timestamp: location.timestamp || new Date().toISOString(),
      },
    }));
    await locationService.updateLocation(mmsi, location);
  };

  const updateMap = (newLocations: Locations) => {
    if (webViewRef.current) {
      const safeLocations = JSON.stringify(newLocations);
      const script = `window.updateLocations(${safeLocations}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleWebViewMessage = (event: any) => {
    const messageData = event.nativeEvent.data;
    if (messageData === "mapReady") {
      setIsLoading(false);
      setIsMapReady(true);
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
          /* --- RESTORED FULL STYLING --- */
          body { margin: 0; padding: 0; }
          #map { height: 100vh; width: 100vw; background: #000; }
          .yacht-icon {
            transform-origin: center;
            transition: transform 0.3s ease-in-out;
          }
          .yacht-icon-motor { --color: #00ff00; }
          .yacht-icon-sailing { --color: #00ffff; }
          .yacht-icon-seized { --color: #ff0000; }
          .yacht-icon svg { transition: transform 0.3s ease-in-out; }
          .yacht-icon.recent svg {
            animation: pulse 2s infinite ease-in-out;
            transform-origin: center;
          }
          @keyframes pulse {
            0% {
              filter: drop-shadow(0 0 2px var(--color));
              transform: scale(1);
            }
            50% {
              filter: drop-shadow(0 0 10px var(--color));
              transform: scale(1.1);
            }
            100% {
              filter: drop-shadow(0 0 2px var(--color));
              transform: scale(1);
            }
          }
          .yacht-info {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            text-align: center;
            white-space: nowrap;
            text-shadow: 1px 1px 4px rgba(0,0,0,0.9);
            background-color: rgba(0, 0, 0, 0.7);
            padding: 4px 8px;
            border-radius: 4px;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
            margin-bottom: 5px;
          }
          .yacht-icon.selected .yacht-info { opacity: 1; }
          .manual-source {
            color: #ffd700;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          /* --- RESTORED DYNAMIC SIZING LOGIC --- */
          const METERS_PER_PIXEL = { 0:156412, 1:78206, 2:39103, 3:19551, 4:9776, 5:4888, 6:2444, 7:1222, 8:611, 9:305, 10:153, 11:76, 12:38, 13:19, 14:9.6, 15:4.8, 16:2.4, 17:1.2, 18:0.6, 19:0.3 };

          const map = L.map('map', { zoomControl: true, attributionControl: false })
            .setView([${MAP_CONFIG.initialView.lat}, ${
    MAP_CONFIG.initialView.lon
  }], ${MAP_CONFIG.initialView.zoom});
          L.tileLayer('${
            MAP_CONFIG.tileLayer
          }', { attribution: false }).addTo(map);

          const markers = {};
          const yachts = ${JSON.stringify(yachts)};
          const statusCodes = ${JSON.stringify(MAP_CONFIG.statusCodes)};
          let selectedMarkers = new Set();

          function getIconSize(zoomLevel, yachtLength) {
            const MIN_SIZE = 8;
            const MAX_SIZE = 150;
            if (zoomLevel >= 14) {
              const metersPerPixel = METERS_PER_PIXEL[zoomLevel] || METERS_PER_PIXEL[14];
              return Math.min(MAX_SIZE, Math.max(MIN_SIZE, yachtLength / metersPerPixel));
            } else {
              const scale = Math.max(0.3, zoomLevel / 14);
              return Math.max(MIN_SIZE, 24 * scale);
            }
          }

          function getFontSize(zoomLevel) {
            const MIN_FONT = 10;
            const MAX_FONT = 24;
            const scale = Math.max(0.3, zoomLevel / 14);
            return Math.min(MAX_FONT, Math.max(MIN_FONT, 12 * scale));
          }

          function sanitizeHtml(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          }

          function createYachtIcon(yacht, loc, isSelected = false) {
             const size = getIconSize(map.getZoom(), parseFloat(yacht.length));
             const fontSize = getFontSize(map.getZoom());
             const iconClass = yacht.seizedBy ? 'seized' : yacht.yachtType.toLowerCase().includes('sail') ? 'sailing' : 'motor';
             const isRecent = (new Date() - new Date(loc.timestamp)) < 60 * 60 * 1000;
             const infoHtml = \`<div class="yacht-info" style="font-size: \${fontSize}px">
                <strong>\${sanitizeHtml(yacht.name)}</strong><br>
                \${sanitizeHtml(yacht.owner)}<br>
                \${loc.speed.toFixed(1)} knots • \${loc.course.toFixed(1)}°<br>
                \${loc.source === "MANUAL" ? "Last seen:" : statusCodes[loc.status] || "Unknown"}<br>
                \${new Date(loc.timestamp).toLocaleString()}
                \${loc.source === "MANUAL" ? '<br><span class="manual-source">Stored position</span>' : ''}
              </div>\`;
             return L.divIcon({
               className: \`yacht-icon yacht-icon-\${iconClass} \${isSelected ? 'selected' : ''} \${isRecent ? 'recent' : ''}\`,
               html: \`<div style="position: relative;">\${infoHtml}<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" style="transform: rotate(\${loc.course || 0}deg)"><path d="M12 2L18 20H6L12 2z" fill="var(--color)"/></svg></div>\`,
               iconSize: [size, size],
               iconAnchor: [size/2, size/2]
             });
          }

          map.on('zoomend', () => {
            Object.values(markers).forEach(marker => {
              marker.setIcon(createYachtIcon(marker.yacht, marker.location, selectedMarkers.has(marker.yacht.mmsi)));
            });
          });

          map.on('click', () => {
             selectedMarkers.clear();
             Object.values(markers).forEach(marker => marker.setIcon(createYachtIcon(marker.yacht, marker.location, false)));
          });

          window.updateLocations = function(locations) {
            Object.entries(locations).forEach(([mmsi, loc]) => {
              const yacht = yachts.find(y => y.mmsi === mmsi);
              if (!yacht || !loc.lat || !loc.lon) return;
              if (markers[mmsi]) {
                markers[mmsi].setLatLng([loc.lat, loc.lon]);
                markers[mmsi].location = loc;
              } else {
                const marker = L.marker([loc.lat, loc.lon], { icon: createYachtIcon(yacht, loc, false) }).addTo(map);
                marker.yacht = yacht;
                marker.location = loc;
                marker.on('click', (e) => {
                    L.DomEvent.stopPropagation(e);
                    selectedMarkers.clear();
                    selectedMarkers.add(mmsi);
                    Object.values(markers).forEach(m => m.setIcon(createYachtIcon(m.yacht, m.location, selectedMarkers.has(m.yacht.mmsi))));
                });
                markers[mmsi] = marker;
              }
            });
          };

          window.focusOnYacht = function(mmsi) {
            const marker = markers[mmsi];
            if (marker) {
              map.setView([marker.location.lat, marker.location.lon], 12);
              selectedMarkers.clear();
              selectedMarkers.add(mmsi);
              Object.values(markers).forEach(m => m.setIcon(createYachtIcon(m.yacht, m.location, selectedMarkers.has(m.yacht.mmsi))));
            }
          }

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
