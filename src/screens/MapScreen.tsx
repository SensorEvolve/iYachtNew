import React, { useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation";
import { Yacht } from "../Types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";
import { locationService } from "../services/YachtLocationService";

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
  const [selectedYacht, setSelectedYacht] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleLocationUpdate = (mmsi: string, location: Position) => {
    setLocations((prev) => {
      const newLocations = {
        ...prev,
        [mmsi]: {
          ...location,
          timestamp: new Date().toISOString(),
        },
      };

      if (webViewRef.current) {
        const updateScript = `
          window.updateLocations('${JSON.stringify(newLocations)}');
          ${selectedYacht === mmsi ? `window.updateTrail('${mmsi}', ${JSON.stringify(locationService.getYachtHistory(mmsi))});` : ""}
          true;
        `;
        webViewRef.current.injectJavaScript(updateScript);
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
          .yacht-trail {
            stroke: #FFFF00;
            stroke-width: 2;
            fill: none;
            opacity: 0.8;
            pointer-events: none;
          }
          .yacht-trail-point {
            fill: #FFFF00;
            opacity: 0.6;
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
          const map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([25.7617, -80.1918], 4);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: false
          }).addTo(map);

          const markers = {};
          const trails = {};
          const yachts = ${JSON.stringify(yachts)};

          const YACHT_BASE_SIZE = 24;
          const YACHT_MIN_SIZE = 8;
          const METERS_PER_PIXEL = {
            0: 156412,
            1: 78206,
            2: 39103,
            3: 19551,
            4: 9776,
            5: 4888,
            6: 2444,
            7: 1222,
            8: 610.984,
            9: 305.492,
            10: 152.746,
            11: 76.373,
            12: 38.187,
            13: 19.093,
            14: 9.547,
            15: 4.773,
            16: 2.387,
            17: 1.193,
            18: 0.596,
            19: 0.298
          };

          map.on('zoomend', () => {
            const currentZoom = map.getZoom();
            updateAllYachtIcons(currentZoom);
          });

          function getIconSize(zoomLevel, yachtLength) {
            if (zoomLevel >= 14) {
              const metersPerPixel = METERS_PER_PIXEL[zoomLevel] || 1;
              return Math.max(YACHT_MIN_SIZE, yachtLength / metersPerPixel);
            } else {
              const scale = Math.max(0.3, (zoomLevel) / 14);
              return Math.max(YACHT_MIN_SIZE, YACHT_BASE_SIZE * scale);
            }
          }

          function createYachtIcon(yacht, loc, zoomLevel) {
            const yachtLength = parseFloat(yacht.length) || 130;
            const iconSize = getIconSize(zoomLevel, yachtLength);
            
            return L.divIcon({
              className: \`yacht-icon yacht-icon-\${getYachtClass(yacht)}\`,
              html: \`<svg width="\${iconSize}" height="\${iconSize}" viewBox="0 0 24 24" style="transform: rotate(\${loc.course}deg)">
                <path d="M12 2L18 20H6L12 2z" fill="\${getYachtColor(yacht)}"/>
                <path d="M9 14h6l-3 6-3-6z" fill="\${getYachtColor(yacht)}" opacity="0.6"/>
              </svg>\`,
              iconSize: [iconSize, iconSize],
              iconAnchor: [iconSize/2, iconSize/2]
            });
          }

          function updateAllYachtIcons(zoomLevel) {
            Object.entries(markers).forEach(([mmsi, marker]) => {
              const yacht = yachts.find(y => y.mmsi === mmsi);
              if (!yacht) return;
              
              const position = marker.getLatLng();
              const icon = createYachtIcon(yacht, { course: marker.course || 0 }, zoomLevel);
              marker.setIcon(icon);
            });
          }

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

          function clearTrail(mmsi) {
            if (trails[mmsi]) {
              trails[mmsi].forEach(layer => map.removeLayer(layer));
              trails[mmsi] = [];
            }
          }

          function drawTrail(mmsi, history) {
            clearTrail(mmsi);
            if (!history || history.length < 2) return;

            trails[mmsi] = [];
            const positions = history.map(pos => [pos.lat, pos.lon]);

            for (let i = 0; i < positions.length; i++) {
              const circle = L.circleMarker(positions[i], {
                radius: 3,
                fillColor: '#FFFF00',
                fillOpacity: Math.max(0.2, 1 - (i / positions.length)),
                stroke: false
              });
              trails[mmsi].push(circle.addTo(map));

              if (i < positions.length - 1) {
                const timeDiff = new Date(history[i + 1].timestamp) - new Date(history[i].timestamp);
                if (timeDiff <= 3 * 60 * 60 * 1000) {
                  const line = L.polyline([positions[i], positions[i + 1]], {
                    color: '#FFFF00',
                    weight: 2,
                    opacity: Math.max(0.2, 1 - (i / positions.length))
                  });
                  trails[mmsi].push(line.addTo(map));
                }
              }
            }
          }

          function createPopupContent(yacht, loc) {
            return \`
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
          }

          window.updateLocations = function(data) {
            const locations = JSON.parse(data);
            const currentZoom = map.getZoom();
            
            Object.entries(locations).forEach(([mmsi, loc]) => {
              const yacht = yachts.find(y => y.mmsi === mmsi);
              if (!yacht || !loc.lat || !loc.lon) return;

              const icon = createYachtIcon(yacht, loc, currentZoom);

              if (markers[mmsi]) {
                markers[mmsi].course = loc.course;
                markers[mmsi].setLatLng([loc.lat, loc.lon]);
                markers[mmsi].setIcon(icon);
                markers[mmsi].getPopup().setContent(createPopupContent(yacht, loc));
              } else {
                markers[mmsi] = L.marker([loc.lat, loc.lon], { icon })
                  .bindPopup(createPopupContent(yacht, loc), {
                    closeButton: false,
                    offset: [0, 5],
                    className: 'yacht-popup-container',
                    autoPan: false,
                    autoClose: false
                  })
                  .on('click', () => {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'yacht_selected',
                      mmsi: mmsi
                    }));
                  })
                  .addTo(map)
                  .openPopup();
                markers[mmsi].course = loc.course;
              }
            });
          }

          window.updateTrail = function(mmsi, history) {
            drawTrail(mmsi, history);
          }

          window.addEventListener('load', function() {
            window.ReactNativeWebView.postMessage('mapReady');
          });
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "yacht_selected") {
        if (selectedYacht === data.mmsi) {
          setSelectedYacht(null);
          webViewRef.current?.injectJavaScript(`
            clearTrail('${data.mmsi}');
            true;
          `);
        } else {
          setSelectedYacht(data.mmsi);
          const history = locationService.getYachtHistory(data.mmsi);
          webViewRef.current?.injectJavaScript(`
            window.updateTrail('${data.mmsi}', ${JSON.stringify(history)});
            true;
          `);
        }
      }
    } catch {
      if (event.nativeEvent.data === "mapReady") {
        setIsLoading(false);
      }
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
