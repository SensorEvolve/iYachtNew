import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation";
import { Yacht, YachtLocation } from "../Types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";
import { locationService } from "../services/YachtLocationService";

type Props = NativeStackScreenProps<RootStackParamList, "Map"> & {
  yachts: Yacht[];
};

const LOG_PREFIX = "🗺️ [MapScreen]";

const MapScreen: React.FC<Props> = ({ yachts }) => {
  const [locations, setLocations] = useState<{ [mmsi: string]: YachtLocation }>({});
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    const loadInitialLocations = async () => {
      try {
        await locationService.waitForInitialization();
        const storedLocations = locationService.getLocations();
        console.log(`${LOG_PREFIX} Loading ${storedLocations.length} stored locations`);

        const initialLocations: { [mmsi: string]: YachtLocation } = {};
        storedLocations.forEach((loc) => {
          initialLocations[loc.mmsi] = loc;
        });

        setLocations(initialLocations);

        if (webViewRef.current) {
          try {
            const updateScript = `
              window.updateLocations(${JSON.stringify(initialLocations)});
              true;
            `;
            webViewRef.current.injectJavaScript(updateScript);
          } catch (error) {
            console.warn(`${LOG_PREFIX} Failed to inject initial locations:`, error);
          }
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error loading initial locations:`, error);
      }
    };

    loadInitialLocations();
  }, []);

  const handleLocationUpdate = async (mmsi: string, location: YachtLocation) => {
    try {
      await locationService.updateLocation(mmsi, location);

      setLocations((prev) => {
        const newLocations = {
          ...prev,
          [mmsi]: location
        };

        if (webViewRef.current) {
          try {
            const updateScript = `
              window.updateLocations(${JSON.stringify(newLocations)});
              true;
            `;
            webViewRef.current.injectJavaScript(updateScript);
          } catch (error) {
            console.warn(`${LOG_PREFIX} Failed to update WebView:`, error);
          }
        }

        return newLocations;
      });
    } catch (error) {
      console.error(`${LOG_PREFIX} Location update failed:`, error);
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
          const map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([25.7617, -80.1918], 4);

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
            attribution: false
          }).addTo(map);

          const markers = {};
          const yachts = ${JSON.stringify(yachts)};

          const YACHT_BASE_SIZE = 24;
          const YACHT_MIN_SIZE = 8;
          const METERS_PER_PIXEL = {
            0: 156412, 1: 78206, 2: 39103, 3: 19551, 4: 9776,
            5: 4888, 6: 2444, 7: 1222, 8: 610.984, 9: 305.492,
            10: 152.746, 11: 76.373, 12: 38.187, 13: 19.093,
            14: 9.547, 15: 4.773, 16: 2.387, 17: 1.193,
            18: 0.596, 19: 0.298
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

          function getYachtColor(yacht) {
            if (yacht.seizedBy) return '#ff0000';
            return yacht.yachtType.toLowerCase().includes('sail') ? '#00ffff' : '#00ff00';
          }

          function getYachtClass(yacht) {
            if (yacht.seizedBy) return 'seized';
            return yacht.yachtType.toLowerCase().includes('sail') ? 'sailing' : 'motor';
          }

          function createPopupContent(yacht, loc) {
            try {
              return \`
                <div class="yacht-popup">
                  <div class="yacht-name">\${yacht.name}</div>
                  <div class="yacht-info">
                    \${yacht.owner}<br>
                    \${(loc.speed || 0).toFixed(1)} knots • \${(loc.course || 0).toFixed(1)}°<br>
                    \${getNavigationStatus(loc.status)}<br>
                    \${formatTimestamp(loc.timestamp)}
                  </div>
                </div>
              \`;
            } catch (error) {
              console.error('Error creating popup content:', error);
              return '<div class="yacht-popup">Error displaying yacht info</div>';
            }
          }

          window.updateLocations = function(locationsData) {
            try {
              const locations = typeof locationsData === 'string'
                ? JSON.parse(locationsData)
                : locationsData;

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
            } catch (error) {
              console.error('Error updating locations:', error);
            }
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
      if (event.nativeEvent.data === "mapReady") {
        setIsLoading(false);
        return;
      }

      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "yacht_selected") {
        console.log(`${LOG_PREFIX} Yacht selected:`, data.mmsi);
      }
    } catch (error) {
      console.warn(`${LOG_PREFIX} Message parsing error:`, error);
    }
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
          console.warn(
            `${LOG_PREFIX} WebView error:`,
            syntheticEvent.nativeEvent,
          );
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

export default MapScreen;
