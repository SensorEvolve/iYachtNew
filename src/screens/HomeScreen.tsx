import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { Yacht } from "../Types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";
import { locationService } from "../services/YachtLocationService";
import { useYachtSelection } from "../contexts/YachtSelectionContext";

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

interface MapScreenProps {
  yachts: Yacht[];
  onYachtSelect?: (yacht: Yacht) => void;
  selectedYachtId?: string | null;
}

const LOG_PREFIX = "🗺️ [MapScreen]";

const MapScreen: React.FC<MapScreenProps> = ({ yachts, onYachtSelect, selectedYachtId }) => {
  const [locations, setLocations] = useState<Locations>({});
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);
  const { selectedYacht } = useYachtSelection();

  useEffect(() => {
    const loadInitialLocations = async () => {
      try {
        await locationService.waitForInitialization();
        const storedLocations = locationService.getLocations();
        console.log(`${LOG_PREFIX} Loading ${storedLocations.length} stored locations`);

        const initialLocations: Locations = {};
        storedLocations.forEach((loc) => {
          initialLocations[loc.mmsi] = {
            lat: loc.lat,
            lon: loc.lon,
            speed: loc.speed,
            course: loc.course,
            status: loc.status,
            timestamp: loc.timestamp,
          };
        });

        setLocations(initialLocations);
        updateMapLocations(initialLocations);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error loading initial locations:`, error);
      }
    };

    loadInitialLocations();
  }, []);

  useEffect(() => {
    if (selectedYachtId) {
      const yacht = yachts.find(y => y.id === selectedYachtId);
      if (yacht && webViewRef.current) {
        const selectScript = `
          window.selectYacht('${yacht.mmsi}');
          true;
        `;
        webViewRef.current.injectJavaScript(selectScript);
      }
    }
  }, [selectedYachtId, yachts]);

  const handleLocationUpdate = (mmsi: string, location: Position) => {
    setLocations((prev) => {
      const newLocations = {
        ...prev,
        [mmsi]: { ...location },
      };
      updateMapLocations(newLocations);
      return newLocations;
    });
  };

  const updateMapLocations = (newLocations: Locations) => {
    if (webViewRef.current) {
      const updateScript = `
        window.updateLocations('${JSON.stringify(newLocations)}');
        true;
      `;
      webViewRef.current.injectJavaScript(updateScript);
    }
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "yacht_selected" && onYachtSelect) {
        const yacht = yachts.find(y => y.mmsi === data.mmsi);
        if (yacht) {
          onYachtSelect(yacht);
        }
      } else if (event.nativeEvent.data === "mapReady") {
        setIsLoading(false);
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error handling message:`, error);
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
          .selected-yacht {
            transform: scale(1.2);
            filter: drop-shadow(0 0 15px var(--yacht-color));
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

          function getYachtColor(yacht) {
            if (yacht.seizedBy) return '#ff0000';
            return yacht.yachtType.toLowerCase().includes('sail') ? '#00ffff' : '#00ff00';
          }

          function getYachtClass(yacht) {
            if (yacht.seizedBy) return 'seized';
            return yacht.yachtType.toLowerCase().includes('sail') ? 'sailing' : 'motor';
          }

          function updateLocations(locationsStr) {
            const locations = JSON.parse(locationsStr);
            Object.entries(locations).forEach(([mmsi, loc]) => {
              const yacht = yachts.find(y => y.mmsi === mmsi);
              if (!yacht || !loc.lat || !loc.lon) return;

              if (markers[mmsi]) {
                markers[mmsi].setLatLng([loc.lat, loc.lon]);
                markers[mmsi].setRotationAngle(loc.course || 0);
                markers[mmsi].getPopup().setContent(createPopupContent(yacht, loc));
              } else {
                createMarker(yacht, loc);
              }
            });
          }

          function selectYacht(mmsi) {
            Object.values(markers).forEach(marker => {
              marker.getElement().classList.remove('selected-yacht');
            });

            if (markers[mmsi]) {
              markers[mmsi].getElement().classList.add('selected-yacht');
              map.setView(markers[mmsi].getLatLng(), 8);
            }
          }

          window.selectYacht = selectYacht;
          window.updateLocations = updateLocations;

          window.addEventListener('load', function() {
            window.ReactNativeWebView.postMessage('mapReady');
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebSocketHandler yachts={yachts} onLocationUpdate={handleLocationUpdate} />
      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML() }}
        style={[styles.map, isLoading && styles.hidden]}
        onMessage={handleWebViewMessage}
        onError={(syntheticEvent) => {
          console.warn(`${LOG_PREFIX} WebView error:`, syntheticEvent.nativeEvent);
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
