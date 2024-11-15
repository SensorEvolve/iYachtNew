import React, { useState, useRef, useEffect } from "react";
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
  const webViewRef = useRef<WebView>(null);

  // Initialize with stored locations
  useEffect(() => {
    const storedLocations = locationService.getLocations();
    const initialLocations: Locations = {};
    storedLocations.forEach((location) => {
      initialLocations[location.mmsi] = {
        lat: location.lat,
        lon: location.lon,
        speed: 0,
        course: 0,
        timestamp: location.timestamp,
      };
    });
    setLocations(initialLocations);
  }, []);

  const handleLocationUpdate = (mmsi: string, location: Position) => {
    console.log("MapScreen received location update:", { mmsi, location });

    // Update LocationService
    locationService.updateLocation(mmsi, {
      lat: location.lat,
      lon: location.lon,
      speed: location.speed,
      course: location.course,
    });

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

  // Rest of your MapScreen code remains exactly the same...
  const getMapHTML = () => `
    // Your existing HTML template...
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
