import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";
import { loadYachtData } from "./src/utils/dataParser";
import { locationService } from "./src/services/YachtLocationService";
import { Yacht, YachtLocation } from "./src/types/yacht";
import AppTabs from "./src/navigators/AppTabs";
import WebSocketHandler from "./src/components/WebSocketHandler";

// This interface now perfectly matches the one in WebSocketHandler.tsx
interface PositionUpdate {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp: string;
}

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- TYPE SIGNATURE CORRECTED ---
  // The 'locationData' parameter now uses the corrected 'PositionUpdate' type.
  const handleLocationUpdate = useCallback(
    (mmsi: string, locationData: PositionUpdate) => {
      console.log(`🛰️ Live AIS Update for MMSI: ${mmsi}`);

      setYachts((prevYachts) =>
        prevYachts.map((yacht) => {
          if (String(yacht.mmsi) === mmsi) {
            const newLocation: YachtLocation = {
              ...locationData,
              mmsi,
              source: "AIS",
            };
            locationService.saveLocation(mmsi, newLocation, "AIS");
            return { ...yacht, location: newLocation };
          }
          return yacht;
        })
      );
    },
    []
  );

  useEffect(() => {
    const initializeAppData = async () => {
      try {
        console.log("🚀 App Initializing...");

        const masterYachtListPromise = loadYachtData();
        const storedLocationsPromise = locationService.loadStoredLocations();
        const [masterYachtList, storedLocations] = await Promise.all([
          masterYachtListPromise,
          storedLocationsPromise,
        ]);

        console.log("🔄 Merging stored and manual locations...");
        const hydratedYachts = masterYachtList.map((yacht) => {
          const storedLocation = storedLocations[yacht.mmsi];
          if (storedLocation) {
            return { ...yacht, location: storedLocation };
          }
          return yacht;
        });

        console.log(
          `✅ Initialization complete. ${hydratedYachts.length} yachts ready.`
        );
        setYachts(hydratedYachts);
      } catch (error) {
        console.error("❌ Failed to initialize app data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAppData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <AppTabs yachts={yachts} isLoading={isLoading} />
        </NavigationContainer>

        <WebSocketHandler
          yachts={yachts}
          onLocationUpdate={handleLocationUpdate}
        />
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
