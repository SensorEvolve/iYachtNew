import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "../types/navigation";
import { Yacht } from "../types/yacht";
import WebSocketHandler from "../components/WebSocketHandler";

// Types
interface LocationForMap {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp?: string;
  source?: "MANUAL" | "AIS";
}

interface LocationsMap {
  [mmsi: string]: LocationForMap;
}

type Props = BottomTabScreenProps<RootTabParamList, "MapTab"> & {
  yachts: Yacht[];
  onLocationUpdate: (mmsi: string, location: any) => void;
};

const LOG_PREFIX = "🗺️ [MapScreen]";

// Map configuration
const MAP_CONFIG = {
  initialView: { lat: 42.57429, lon: 17.19905, zoom: 4 },
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

const MapScreen: React.FC<Props> = ({ route, yachts, onLocationUpdate }) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [updateCounter, setUpdateCounter] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const focusedMmsi = route.params?.focusedMmsi;

  // Debug: Log yacht data changes
  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔍 Total yachts received: ${yachts.length}`);

    // Check specific yachts for debugging
    const debugYachts = ['KORU', 'INFINITY', 'RADIANT'];
    debugYachts.forEach(name => {
      const yacht = yachts.find(y => y.name?.toUpperCase().includes(name.toUpperCase()));
      if (yacht) {
        console.log(`${LOG_PREFIX} 🔍 ${name} data:`, {
          mmsi: yacht.mmsi,
          name: yacht.name,
          hasLocation: !!yacht.location,
          location: yacht.location ? {
            lat: yacht.location.lat,
            lon: yacht.location.lon,
            timestamp: yacht.location.timestamp,
            source: yacht.location.source
          } : null,
          lastUpdate: yacht.lastUpdate
        });
      } else {
        console.log(`${LOG_PREFIX} 🔍 ${name} not found in yacht data`);
      }
    });
  }, [yachts]);

  // Enhanced location update handler with debugging
  const enhancedLocationUpdate = (mmsi: string, locationData: any) => {
    console.log(`${LOG_PREFIX} 📍 Incoming location update for MMSI ${mmsi}:`, locationData);

    // Find the yacht name for debugging
    const yacht = yachts.find(y => y.mmsi === mmsi);
    const yachtName = yacht?.name || 'Unknown';

    console.log(`${LOG_PREFIX} 📍 Update for ${yachtName} (${mmsi}):`, {
      lat: locationData.lat,
      lon: locationData.lon,
      speed: locationData.speed,
      timestamp: locationData.timestamp
    });

    // Call the original handler
    onLocationUpdate(mmsi, locationData);

    // Trigger a re-render counter for debugging
    setUpdateCounter(prev => prev + 1);
  };

  // Convert yacht locations to map format with detailed logging
  const locations = useMemo<LocationsMap>(() => {
    const locationMap: LocationsMap = {};
    let manualCount = 0;
    let aisCount = 0;
    let recentCount = 0;

    yachts.forEach((yacht) => {
      if (yacht.location && yacht.mmsi) {
        const location = {
          lat: yacht.location.lat,
          lon: yacht.location.lon,
          speed: yacht.location.speed || 0,
          course: yacht.location.course || 0,
          status: yacht.location.status,
          timestamp: yacht.location.timestamp,
          source: yacht.location.source,
        };

        locationMap[yacht.mmsi] = location;

        // Count sources
        if (location.source === "MANUAL") {
          manualCount++;
        } else {
          aisCount++;
        }

        // Count recent updates (within 1 hour)
        if (location.timestamp) {
          const updateTime = new Date(location.timestamp);
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          if (updateTime > hourAgo) {
            recentCount++;
          }
        }

        // Debug specific yachts
        if (yacht.name?.toUpperCase().includes('KORU')) {
          console.log(`${LOG_PREFIX} 🔍 KORU location processing:`, {
            input: yacht.location,
            output: location,
            timestamp: location.timestamp,
            isRecent: location.timestamp ? new Date(location.timestamp) > new Date(Date.now() - 60 * 60 * 1000) : false
          });
        }
      }
    });

    console.log(`${LOG_PREFIX} Generated locations for ${Object.keys(locationMap).length} yachts`);
    console.log(`${LOG_PREFIX} 📊 Location breakdown: ${manualCount} manual, ${aisCount} AIS, ${recentCount} recent`);
    console.log(`${LOG_PREFIX} 🔄 Update counter: ${updateCounter}`);

    return locationMap;
  }, [yachts, updateCounter]);

  // Update map when locations change with detailed logging - FIXED VERSION
  useEffect(() => {
    if (isMapReady && hasInitialized && Object.keys(locations).length > 0) {
      console.log(`${LOG_PREFIX} 🗺️ Updating map with ${Object.keys(locations).length} locations`);

      // Log a few sample locations for debugging
      const sampleKeys = Object.keys(locations).slice(0, 3);
      sampleKeys.forEach(mmsi => {
        const yacht = yachts.find(y => y.mmsi === mmsi);
        console.log(`${LOG_PREFIX} 🗺️ Sample location - ${yacht?.name || mmsi}:`, locations[mmsi]);
      });

      updateMap(locations);
    } else {
      console.log(`${LOG_PREFIX} 🗺️ Map update skipped - Ready: ${isMapReady}, Initialized: ${hasInitialized}, Locations: ${Object.keys(locations).length}`);
    }
  }, [isMapReady, hasInitialized, locations]);

  const updateMap = (newLocations: LocationsMap) => {
    if (webViewRef.current) {
      try {
        console.log(`${LOG_PREFIX} 🗺️ Injecting JavaScript to update ${Object.keys(newLocations).length} locations`);
        const script = `
          console.log('🌐 Map update received:', Object.keys(${JSON.stringify(newLocations)}).length, 'locations');
          window.updateLocations(${JSON.stringify(newLocations)}); 
          true;
        `;
        webViewRef.current.injectJavaScript(script);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error updating map:`, error);
      }
    }
  };

  // FIXED: Enhanced message handler to prevent reload issues
  const handleWebViewMessage = (event: any) => {
    const messageData = event.nativeEvent.data;

    if (messageData === "mapReady") {
      console.log(`${LOG_PREFIX} WebView is ready`);
      if (!hasInitialized) {
        setIsMapReady(true);
        setHasInitialized(true);
        console.log(`${LOG_PREFIX} ✅ Map initialized for first time`);
      } else {
        console.log(`${LOG_PREFIX} ⚠️ WebView reloaded - this should not happen!`);
        // Don't set ready again to prevent double initialization
      }
      return;
    }

    try {
      const data = JSON.parse(messageData);
      if (data.type === "yacht_selected") {
        const yacht = yachts.find(y => y.mmsi === data.mmsi);
        console.log(`${LOG_PREFIX} Yacht selected: ${yacht?.name || data.mmsi} (${data.mmsi})`);
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
          .yacht-icon { transform-origin: center; transition: transform 0.3s ease-in-out; }
          .yacht-icon-motor { --color: #00ff00; }
          .yacht-icon-sailing { --color: #00ffff; }
          .yacht-icon-seized { --color: #ff0000; }
          .yacht-icon svg { transition: transform 0.3s ease-in-out; }
          .yacht-icon.recent svg { animation: pulse 2s infinite ease-in-out; transform-origin: center; }
          @keyframes pulse {
            0% { filter: drop-shadow(0 0 2px var(--color)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 10px var(--color)); transform: scale(1.1); }
            100% { filter: drop-shadow(0 0 2px var(--color)); transform: scale(1); }
          }
          .yacht-info {
            position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
            color: white; text-align: center; white-space: nowrap;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.9);
            background-color: rgba(0, 0, 0, 0.6); padding: 3px 6px; border-radius: 4px;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none; margin-bottom: 5px;
          }
          .yacht-icon.selected .yacht-info { opacity: 1; }
          .manual-source { color: #ffd700; font-style: italic; }
          .recent-update { color: #00ff88; font-weight: bold; }
          .old-update { color: #ffaa00; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          console.log('🌐 Map HTML loaded - starting initialization');
          
          // Test console logging
          console.log('🌐 TEST: WebView JavaScript is running, will have', ${yachts.length}, 'yachts');
          
          const METERS_PER_PIXEL = {
            0: 156412, 1: 78206, 2: 39103, 3: 19551, 4: 9776, 5: 4888, 6: 2444, 7: 1222, 8: 611, 9: 305,
            10: 153, 11: 76, 12: 38, 13: 19, 14: 9.6, 15: 4.8, 16: 2.4, 17: 1.2, 18: 0.6, 19: 0.3
          };

          const map = L.map('map', { zoomControl: true, attributionControl: false })
            .setView([${MAP_CONFIG.initialView.lat}, ${MAP_CONFIG.initialView.lon}], ${MAP_CONFIG.initialView.zoom});

          L.tileLayer('${MAP_CONFIG.tileLayer}', { attribution: false }).addTo(map);

          const markers = {};
          const yachts = ${JSON.stringify(yachts)};
          const statusCodes = ${JSON.stringify(MAP_CONFIG.statusCodes)};
          let selectedMarkers = new Set();
          const focusedMmsi = ${focusedMmsi ? `'${focusedMmsi}'` : "null"};

          console.log('🌐 Map initialized with', yachts.length, 'yachts');

          function getIconSize(zoomLevel, yachtLength) {
            const MIN_SIZE = 8, MAX_SIZE = 150;
            if (zoomLevel >= 14) {
              const metersPerPixel = METERS_PER_PIXEL[zoomLevel] || METERS_PER_PIXEL[14];
              return Math.min(MAX_SIZE, Math.max(MIN_SIZE, yachtLength / metersPerPixel));
            } else {
              const scale = Math.max(0.3, zoomLevel / 14);
              return Math.max(MIN_SIZE, 24 * scale);
            }
          }

          function getFontSize(zoomLevel) {
            const MIN_FONT = 10, MAX_FONT = 20;
            const scale = Math.max(0.3, zoomLevel / 14);
            return Math.min(MAX_FONT, Math.max(MIN_FONT, MIN_FONT * scale));
          }

          function sanitizeHtml(str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          }

          function createYachtIcon(yacht, loc, isSelected = false) {
            const size = getIconSize(map.getZoom(), parseFloat(yacht.length));
            const fontSize = getFontSize(map.getZoom());
            const iconClass = yacht.seizedBy ? 'seized' :
              yacht.yachtType.toLowerCase().includes('sail') ? 'sailing' : 'motor';
            
            // Check if update is recent (within 1 hour)
            const isRecent = loc.timestamp && (new Date() - new Date(loc.timestamp)) < 60 * 60 * 1000;
            
            // Format timestamp for display
            const timestampDisplay = loc.timestamp ? new Date(loc.timestamp).toLocaleString() : 'Unknown';
            const timestampClass = isRecent ? 'recent-update' : 'old-update';

            const infoHtml = \`<div class="yacht-info" style="font-size: \${fontSize}px">
              <strong>\${sanitizeHtml(yacht.name)}</strong><br>
              \${sanitizeHtml(yacht.owner || 'Unknown Owner')}<br>
              \${loc.speed ? loc.speed.toFixed(1) : '0'} knots • \${loc.course ? loc.course.toFixed(1) : '0'}°<br>
              \${loc.source === "MANUAL" ? "Last seen:" : (statusCodes[loc.status] || "Unknown")}<br>
              <span class="\${timestampClass}">\${timestampDisplay}</span>
              \${loc.source === "MANUAL" ? '<br><span class="manual-source">Manual position</span>' : ''}
              \${isRecent ? '<br><span class="recent-update">🟢 Live</span>' : '<br><span class="old-update">🟡 Historic</span>'}
            </div>\`;

            return L.divIcon({
              className: \`yacht-icon yacht-icon-\${iconClass} \${isSelected ? 'selected' : ''} \${isRecent ? 'recent' : ''}\`,
              html: \`<div style="position: relative;">\${infoHtml}
                <svg width="\${size}" height="\${size}" viewBox="0 0 24 24" style="transform: rotate(\${loc.course || 0}deg)">
                  <path d="M12 2L18 20H6L12 2z" fill="var(--color)"/>
                  <path d="M9 14h6l-3 6-3-6z" fill="var(--color)" opacity="0.6"/>
                </svg></div>\`,
              iconSize: [size, size], iconAnchor: [size/2, size/2]
            });
          }

          map.on('zoomend', () => {
            console.log('🌐 Map zoom changed, updating', Object.keys(markers).length, 'markers');
            Object.entries(markers).forEach(([mmsi, marker]) => {
              const yacht = yachts.find(y => y.mmsi === mmsi);
              if (yacht && marker.location) {
                marker.setIcon(createYachtIcon(yacht, marker.location, selectedMarkers.has(mmsi)));
              }
            });
          });

          map.on('click', () => {
            selectedMarkers.forEach(mmsi => {
              const marker = markers[mmsi];
              if (marker && marker.yacht && marker.location) {
                marker.setIcon(createYachtIcon(marker.yacht, marker.location, false));
              }
            });
            selectedMarkers.clear();
          });

          // ENHANCED updateLocations function with extensive debugging
          window.updateLocations = function(data) {
            console.log('🌐 === UPDATE LOCATIONS START ===');
            console.log('🌐 Data type:', typeof data);
            console.log('🌐 Current markers count before update:', Object.keys(markers).length);
            
            try {
              const locations = typeof data === 'string' ? JSON.parse(data) : data;
              console.log('🌐 Parsed locations count:', Object.keys(locations).length);
              console.log('🌐 First 3 location MMSIs:', Object.keys(locations).slice(0, 3));

              let updatedCount = 0;
              let newCount = 0;
              let errorCount = 0;

              Object.entries(locations).forEach(([mmsi, loc]) => {
                try {
                  const yacht = yachts.find(y => y.mmsi === mmsi);
                  if (!yacht || !loc || typeof loc.lat !== 'number' || typeof loc.lon !== 'number') {
                    console.log('🌐 Skipping invalid location for', mmsi, 'yacht:', !!yacht, 'location valid:', !!loc);
                    errorCount++;
                    return;
                  }

                  // Validate coordinates
                  if (Math.abs(loc.lat) > 90 || Math.abs(loc.lon) > 180) {
                    console.warn('🌐 Invalid coordinates for', mmsi, ':', loc.lat, loc.lon);
                    errorCount++;
                    return;
                  }

                  // Debug specific yachts
                  if (yacht.name && yacht.name.toUpperCase().includes('KORU')) {
                    console.log('🌐 Processing KORU location:', {
                      mmsi: mmsi,
                      name: yacht.name,
                      location: loc,
                      hasMarker: !!markers[mmsi]
                    });
                  }

                  if (markers[mmsi]) {
                    // Update existing marker
                    const existingMarker = markers[mmsi];
                    existingMarker.setLatLng([loc.lat, loc.lon]);
                    existingMarker.location = loc;
                    existingMarker.setIcon(createYachtIcon(yacht, loc, selectedMarkers.has(mmsi)));
                    updatedCount++;
                    console.log('🌐 Updated marker for', yacht.name);
                  } else {
                    // Create new marker
                    console.log('🌐 Creating new marker for', yacht.name, 'at', loc.lat, loc.lon);
                    const newMarker = L.marker([loc.lat, loc.lon], { 
                      icon: createYachtIcon(yacht, loc, false) 
                    }).on('click', function(e) {
                      e.originalEvent.stopPropagation();
                      const isSelected = selectedMarkers.has(mmsi);
                      if (isSelected) {
                        selectedMarkers.delete(mmsi);
                      } else {
                        selectedMarkers.add(mmsi);
                      }
                      this.setIcon(createYachtIcon(yacht, loc, !isSelected));
                      window.ReactNativeWebView.postMessage(JSON.stringify({ 
                        type: 'yacht_selected', 
                        mmsi: mmsi 
                      }));
                    });
                    
                    // Add to map BEFORE storing in markers object
                    newMarker.addTo(map);
                    console.log('🌐 Added marker to map for', yacht.name);
                    
                    // Store references
                    newMarker.yacht = yacht;
                    newMarker.location = loc;
                    markers[mmsi] = newMarker;
                    newCount++;
                  }
                } catch (itemError) {
                  console.error('🌐 Error processing single yacht:', mmsi, itemError.message);
                  errorCount++;
                }
              });

              console.log('🌐 Map update complete:', {
                updated: updatedCount,
                created: newCount,
                errors: errorCount,
                totalMarkers: Object.keys(markers).length
              });

              // Verify markers are still on map
              let visibleCount = 0;
              Object.entries(markers).forEach(([mmsi, marker]) => {
                if (map.hasLayer(marker)) {
                  visibleCount++;
                } else {
                  console.warn('🌐 Marker not visible on map:', marker.yacht?.name, mmsi);
                }
              });
              console.log('🌐 Visible markers verification:', visibleCount, 'of', Object.keys(markers).length, 'are visible');

              // Focus on specific yacht if requested
              if (focusedMmsi && markers[focusedMmsi]) {
                const marker = markers[focusedMmsi];
                console.log('🌐 Focusing on yacht:', focusedMmsi, marker.yacht.name);
                map.setView([marker.location.lat, marker.location.lon], 12);
                selectedMarkers.clear();
                selectedMarkers.add(focusedMmsi);
                marker.setIcon(createYachtIcon(marker.yacht, marker.location, true));
              }

              console.log('🌐 === UPDATE LOCATIONS END ===');
            } catch(e) {
              console.error('🌐 CRITICAL ERROR in updateLocations:', e.message);
              console.error('🌐 Error stack:', e.stack);
            }
          };

          // Test timer to verify console is working
          setTimeout(() => {
            console.log('🌐 TEST: 5 second timer - markers object has:', Object.keys(markers).length, 'markers');
          }, 5000);

          console.log('🌐 Sending mapReady message');
          window.ReactNativeWebView.postMessage('mapReady');
        </script>
      </body>
    </html>
  `;
  const memoizedHTML = useMemo(() => getMapHTML(), [yachts.length, focusedMmsi]);

  return (
    <View style={styles.container}>
      <WebSocketHandler yachts={yachts} onLocationUpdate={enhancedLocationUpdate} />
      <WebView
        ref={webViewRef}
        source={{ html: memoizedHTML }}
        style={[styles.map, !isMapReady && styles.hidden]}
        onMessage={handleWebViewMessage}
        cacheEnabled={false}
        domStorageEnabled={false}
        javaScriptEnabled={true}
        onShouldStartLoadWithRequest={() => true}
        onError={(error) =>
          console.warn(`${LOG_PREFIX} WebView error:`, error.nativeEvent)
        }
        onConsoleMessage={(event) => {
          const message = event.nativeEvent.message;
          console.log(`${message}`);
        }}
      />
      {!isMapReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff00" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  map: { flex: 1 },
  hidden: { opacity: 0 },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
});

export default MapScreen;
