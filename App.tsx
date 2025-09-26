import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { ActivityIndicator, View, StyleSheet, Text } from "react-native";
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

// Debug component to help diagnose location issues
const LocationDebugger: React.FC<{ yachts: Yacht[] }> = ({ yachts }) => {
  useEffect(() => {
    console.log("=== Location Debug Info ===");
    console.log("Total yachts loaded:", yachts.length);

    const yachtsWithLocations = yachts.filter((y) => y.location);
    console.log("Yachts with locations:", yachtsWithLocations.length);

    const manualLocations = yachts.filter(
      (y) => y.location?.source === "MANUAL"
    );
    const aisLocations = yachts.filter((y) => y.location?.source === "AIS");

    console.log("Manual/CSV locations:", manualLocations.length);
    console.log("AIS locations:", aisLocations.length);

    if (yachtsWithLocations.length > 0) {
      console.log(
        "Sample yachts with locations:",
        yachtsWithLocations.slice(0, 5).map((y) => ({
          name: y.name,
          mmsi: y.mmsi,
          source: y.location?.source,
          lat: y.location?.lat,
          lon: y.location?.lon,
          timestamp: y.location?.timestamp,
        }))
      );
    }
    console.log("==========================");
  }, [yachts]);

  return null;
};

// Connection status display component
const ConnectionStatus: React.FC<{ yachts: Yacht[] }> = ({ yachts }) => {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    const yachtsWithRecentLocations = yachts.filter((yacht) => {
      if (!yacht.location) return false;
      const locationTime = new Date(yacht.location.timestamp);
      const now = new Date();
      const diffMinutes =
        (now.getTime() - locationTime.getTime()) / (1000 * 60);
      return diffMinutes < 60; // Updated within last hour
    });

    if (yachtsWithRecentLocations.length > 0) {
      setLastUpdate(new Date().toLocaleTimeString());
      setUpdateCount((prev) => prev + 1);
    }
  }, [yachts]);

  const totalWithLocations = yachts.filter((y) => y.location).length;

  return (
    <View style={styles.debugStatus}>
      <Text style={styles.debugText}>
        📍 Locations: {totalWithLocations} | Updates: {updateCount} | Last:{" "}
        {lastUpdate || "None"}
      </Text>
    </View>
  );
};

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [debugMode] = useState(__DEV__); // Only show debug info in development

  // --- FIXED: Enhanced location update handler ---
  const handleLocationUpdate = useCallback(
    (
      mmsi: string,
      locationData: PositionUpdate,
      source: "AIS" | "MANUAL" = "AIS"
    ) => {
      console.log(`🛰️ Location Update for MMSI: ${mmsi} (Source: ${source})`, {
        lat: locationData.lat,
        lon: locationData.lon,
        speed: locationData.speed,
        timestamp: locationData.timestamp,
      });

      setYachts((prevYachts) =>
        prevYachts.map((yacht) => {
          if (String(yacht.mmsi) === mmsi) {
            const newLocation: YachtLocation = {
              ...locationData,
              mmsi,
              source,
            };

            // Only save to storage if it's a new AIS update (not loading stored data)
            if (source === "AIS") {
              locationService.saveLocation(mmsi, newLocation, "AIS");
            }

            console.log(
              `📍 Updated location for ${yacht.name} (${mmsi}) - Source: ${source}`
            );
            return { ...yacht, location: newLocation };
          }
          return yacht;
        })
      );
    },
    []
  );

  // --- FIXED: Process stored locations on app start ---
  const processStoredLocations = useCallback(
    (yachtsWithStoredData: Yacht[]) => {
      console.log("🔄 Processing stored and manual locations...");

      let processedCount = 0;

      yachtsWithStoredData.forEach((yacht) => {
        if (yacht.location) {
          const locationData: PositionUpdate = {
            lat: yacht.location.lat,
            lon: yacht.location.lon,
            speed: yacht.location.speed,
            course: yacht.location.course,
            status: yacht.location.status,
            timestamp: yacht.location.timestamp,
          };

          // Simulate receiving this stored location (but don't save it again)
          console.log(
            `📂 Loading stored location for ${
              yacht.name
            }: ${yacht.location.lat.toFixed(4)}, ${yacht.location.lon.toFixed(
              4
            )} (${yacht.location.source})`
          );

          // Trigger the location update without saving to storage
          setTimeout(() => {
            handleLocationUpdate(
              yacht.mmsi,
              locationData,
              yacht.location!.source
            );
          }, 100 + processedCount * 50); // Stagger the updates slightly

          processedCount++;
        }
      });

      if (processedCount > 0) {
        console.log(`✅ Will process ${processedCount} stored locations`);
      }
    },
    [handleLocationUpdate]
  );

  useEffect(() => {
    const initializeAppData = async () => {
      try {
        console.log("🚀 App Initializing...");

        // Load yacht data and stored locations in parallel
        const masterYachtListPromise = loadYachtData();
        const storedLocationsPromise = locationService.loadStoredLocations();

        const [masterYachtList, storedLocations] = await Promise.all([
          masterYachtListPromise,
          storedLocationsPromise,
        ]);

        console.log("🔄 Merging stored and manual locations...");
        const hydratedYachts = masterYachtList.map((yacht) => {
          // Prioritize stored locations over CSV locations (stored are more recent)
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

        // --- FIXED: Process stored locations after setting yachts ---
        // This ensures stored locations trigger visual updates
        setTimeout(() => {
          processStoredLocations(hydratedYachts);
        }, 500); // Give React time to render the initial state
      } catch (error) {
        console.error("❌ Failed to initialize app data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAppData();
  }, [processStoredLocations]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading yacht data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          {/* Debug components - only visible in development */}
          {debugMode && (
            <>
              <LocationDebugger yachts={yachts} />
              <ConnectionStatus yachts={yachts} />
            </>
          )}

          <AppTabs yachts={yachts} isLoading={isLoading} />
        </NavigationContainer>

        {/* WebSocket Handler for real-time updates */}
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  debugStatus: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: "#00ff00",
    fontSize: 12,
    textAlign: "center",
    fontFamily: "monospace",
  },
});
