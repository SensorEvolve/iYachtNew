import React, { useState, useRef, useEffect, useMemo } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import WebView from "react-native-webview";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { RootTabParamList } from "../types/navigation";
import { Yacht, YachtLocation } from "../types/yacht";

// --- TYPE DEFINITIONS ---
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
  isLoading: boolean;
};

const LOG_PREFIX = "🗺️ [MapScreen]";

// --- MAP CONFIGURATION (no changes) ---
const MAP_CONFIG = {
  initialView: { lat: 42.57429, lon: 17.19905, zoom: 4 },
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

// --- SIMPLIFIED MAP SCREEN COMPONENT ---
const MapScreen: React.FC<Props> = ({ route, yachts, isLoading }) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const locations = useMemo<LocationsMap>(() => {
    console.log(`${LOG_PREFIX} Re-calculating locations for map...`);

    // --- THIS IS THE FIX ---
    // We explicitly type 'acc' (the accumulator) and 'yacht' (the current item).
    return yachts.reduce((acc: LocationsMap, yacht: Yacht) => {
      if (yacht.location && yacht.mmsi) {
        acc[yacht.mmsi] = {
          lat: yacht.location.lat,
          lon: yacht.location.lon,
          speed: yacht.location.speed,
          course: yacht.location.course,
          status: yacht.location.status,
          timestamp: yacht.location.timestamp,
          source: yacht.location.source,
        };
      }
      return acc;
    }, {} as LocationsMap);
  }, [yachts]);

  useEffect(() => {
    if (isMapReady && Object.keys(locations).length > 0) {
      updateMap(locations);
    }
  }, [isMapReady, locations]);

  const updateMap = (newLocations: LocationsMap) => {
    if (webViewRef.current) {
      const script = `window.updateLocations(${JSON.stringify(
        newLocations
      )}); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleWebViewMessage = (event: any) => {
    const messageData = event.nativeEvent.data;
    if (messageData === "mapReady") {
      console.log(`${LOG_PREFIX} WebView is ready.`);
      setIsMapReady(true);
    }
  };

  const focusedMmsi = route.params?.focusedMmsi;

  // The getMapHTML function remains the same.
  const getMapHTML = (mmsiToFocus?: string) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; } #map { height: 100vh; width: 100vw; background: #000; }
          .yacht-icon { transform-origin: center; transition: transform 0.3s ease-in-out; }
          .yacht-icon-motor { --color: #00ff00; } .yacht-icon-sailing { --color: #00ffff; } .yacht-icon-seized { --color: #ff0000; }
          .yacht-icon svg { transition: transform 0.3s ease-in-out; } .yacht-icon.recent svg { animation: pulse 2s infinite ease-in-out; transform-origin: center; }
          @keyframes pulse { 0% { filter: drop-shadow(0 0 2px var(--color)); transform: scale(1); } 50% { filter: drop-shadow(0 0 10px var(--color)); transform: scale(1.1); } 100% { filter: drop-shadow(0 0 2px var(--color)); transform: scale(1); } }
          .yacht-info { position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); color: white; text-align: center; white-space: nowrap; text-shadow: 1px 1px 4px rgba(0,0,0,0.9); background-color: rgba(0, 0, 0, 0.6); padding: 3px 6px; border-radius: 4px; opacity: 0; transition: opacity 0.3s ease; pointer-events: none; margin-bottom: 5px; }
          .yacht-icon.selected .yacht-info { opacity: 1; } .manual-source { color: #ffd700; font-style: italic; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const METERS_PER_PIXEL = { 0: 156412, 1: 78206, 2: 39103, 3: 19551, 4: 9776, 5: 4888, 6: 2444, 7: 1222, 8: 611, 9: 305, 10: 153, 11: 76, 12: 38, 13: 19, 14: 9.6, 15: 4.8, 16: 2.4, 17: 1.2, 18: 0.6, 19: 0.3 };
          const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${
            MAP_CONFIG.initialView.lat
          }, ${MAP_CONFIG.initialView.lon}], ${MAP_CONFIG.initialView.zoom});
          L.tileLayer('${
            MAP_CONFIG.tileLayer
          }', { attribution: false }).addTo(map);
          const markers = {}; const yachts = ${JSON.stringify(
            yachts
          )}; const statusCodes = ${JSON.stringify(MAP_CONFIG.statusCodes)};
          let selectedMarkers = new Set(); const focusedMmsi = ${
            mmsiToFocus ? `'${mmsiToFocus}'` : "null"
          };
          function getIconSize(zoom, len) { const MIN=8, MAX=150; if(zoom>=14) {const mpp=METERS_PER_PIXEL[zoom]||METERS_PER_PIXEL[14]; return Math.min(MAX,Math.max(MIN,len/mpp));} else {const s=Math.max(0.3,zoom/14); return Math.max(MIN,24*s);} }
          function getFontSize(zoom) { const MIN=10, MAX=24; const s=Math.max(0.3,zoom/14); return Math.min(MAX,Math.max(MIN,MIN*s)); }
          function s(str){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
          function createYachtIcon(y,loc,isSelected=false){const size=getIconSize(map.getZoom(),parseFloat(y.length)); const fSize=getFontSize(map.getZoom()); const iClass=y.seizedBy?'seized':y.yachtType.toLowerCase().includes('sail')?'sailing':'motor'; const isRecent=(new Date()-new Date(loc.timestamp))<36e5; const info=\`<div class="yacht-info" style="font-size:\${fSize}px"><strong>\${s(y.name)}</strong><br>\${s(y.owner)}<br>\${loc.speed.toFixed(1)} kn • \${loc.course.toFixed(1)}°<br>\${loc.source==="MANUAL"?"Last seen:":statusCodes[loc.status]||"Unknown"}<br>\${new Date(loc.timestamp).toLocaleString()}\${loc.source==="MANUAL"?'<br><span class="manual-source">Stored</span>':''}</div>\`; return L.divIcon({className:\`yacht-icon yacht-icon-\${iClass} \${isSelected?'selected':''} \${isRecent?'recent':''}\`,html:\`<div style="position:relative;">\${info}<svg width="\${size}" height="\${size}" viewBox="0 0 24 24" style="transform:rotate(\${loc.course||0}deg)"><path d="M12 2L18 20H6L12 2z" fill="var(--color)"/><path d="M9 14h6l-3 6-3-6z" fill="var(--color)" opacity="0.6"/></svg></div>\`,iconSize:[size,size],iconAnchor:[size/2,size/2]});}
          map.on('zoomend',()=>{Object.entries(markers).forEach(([m,marker])=>{const y=yachts.find(y=>y.mmsi===m); if(y)marker.setIcon(createYachtIcon(y,marker.location,selectedMarkers.has(m)));});});
          map.on('click',()=>{selectedMarkers.forEach(m=>{const marker=markers[m]; if(marker)marker.setIcon(createYachtIcon(marker.yacht,marker.location,false));}); selectedMarkers.clear();});
          window.updateLocations=function(data){try{const locs=typeof data==='string'?JSON.parse(data):data; Object.entries(locs).forEach(([m,loc])=>{const y=yachts.find(y=>y.mmsi===m); if(!y||!loc.lat||!loc.lon)return; if(markers[m]){markers[m].setLatLng([loc.lat,loc.lon]); markers[m].location=loc; markers[m].setIcon(createYachtIcon(y,loc,selectedMarkers.has(m)));}else{const marker=L.marker([loc.lat,loc.lon],{icon:createYachtIcon(y,loc,false)}).on('click',(e)=>{e.originalEvent.stopPropagation(); const isSel=selectedMarkers.has(m); selectedMarkers.forEach(id=>{const old=markers[id]; if(old&&id!==m)old.setIcon(createYachtIcon(old.yacht,old.location,false));}); selectedMarkers.clear(); if(!isSel)selectedMarkers.add(m); marker.setIcon(createYachtIcon(y,loc,!isSel)); window.ReactNativeWebView.postMessage(JSON.stringify({type:'yacht_selected',mmsi:m}));}).addTo(map); marker.yacht=y; marker.location=loc; markers[m]=marker;}});}catch(e){console.error('Update Error:',e);}};
          function focusOnYacht(mmsi){const marker=markers[mmsi]; if(marker){map.setView([marker.location.lat,marker.location.lon],12); selectedMarkers.forEach(id=>{const old=markers[id]; if(old)old.setIcon(createYachtIcon(old.yacht,old.location,false));}); selectedMarkers.clear(); selectedMarkers.add(mmsi); marker.setIcon(createYachtIcon(marker.yacht,marker.location,true)); console.log('Focused on '+mmsi);}}
          window.ReactNativeWebView.postMessage('mapReady');
          if(focusedMmsi){const origUpdate=window.updateLocations; window.updateLocations=function(data){origUpdate(data); focusOnYacht(focusedMmsi); window.updateLocations=origUpdate;};}
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: getMapHTML(focusedMmsi) }}
        style={[styles.map, isLoading && !isMapReady && styles.hidden]}
        onMessage={handleWebViewMessage}
        onError={(e) =>
          console.warn(`${LOG_PREFIX} WebView error:`, e.nativeEvent)
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
