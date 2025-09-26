import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";

// Import your components
import AppTabs from "./src/navigators/AppTabs";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";

// Import types and utilities
import { Yacht, YachtLocation } from "./src/types/yacht";
import { loadYachtData } from "./src/utils/dataParser";
import { locationService } from "./src/services/YachtLocationService";

const LOG_PREFIX = "🚀 [App]";

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Handle location updates from WebSocket
  const handleLocationUpdate = useCallback(
    (mmsi: string, locationData: any) => {
      console.log(`${LOG_PREFIX} Updating location for ${mmsi}`);

      const newLocation: YachtLocation = {
        mmsi,
        lat: locationData.lat,
        lon: locationData.lon,
        speed: locationData.speed,
        course: locationData.course,
        status: locationData.status,
        timestamp: locationData.timestamp || new Date().toISOString(),
        source: "AIS",
      };

      // Save to location service
      locationService.saveLocation(mmsi, newLocation, "AIS");

      // Update yacht state with new location
      setYachts((prevYachts) =>
        prevYachts.map((yacht) => {
          if (yacht.mmsi === mmsi) {
            return {
              ...yacht,
              location: newLocation,
            };
          }
          return yacht;
        })
      );
    },
    []
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log(`${LOG_PREFIX} Starting app initialization`);

        // Step 1: Load stored locations
        const storedLocations = await locationService.loadStoredLocations();
        console.log(
          `${LOG_PREFIX} Loaded ${
            Object.keys(storedLocations).length
          } stored locations`
        );

        // Step 2: Load yacht data from CSV
        const loadedYachts = await loadYachtData();
        console.log(
          `${LOG_PREFIX} Loaded ${loadedYachts.length} yachts from CSV`
        );

        // Step 3: Merge stored locations with yacht data
        const yachtsWithLocations = loadedYachts.map((yacht) => {
          const storedLocation = yacht.mmsi
            ? storedLocations[yacht.mmsi]
            : undefined;

          // Prioritize CSV location over stored location if CSV has newer data
          let finalLocation = yacht.location; // From CSV

          if (storedLocation) {
            if (!finalLocation) {
              // No CSV location, use stored
              finalLocation = storedLocation;
            } else if (storedLocation.source === "AIS") {
              // Stored location is from AIS (more recent), use it
              finalLocation = storedLocation;
            } else if (
              finalLocation.source === "MANUAL" &&
              storedLocation.source === "MANUAL"
            ) {
              // Both manual, use newer timestamp
              const csvTime = new Date(finalLocation.timestamp).getTime();
              const storedTime = new Date(storedLocation.timestamp).getTime();
              if (storedTime > csvTime) {
                finalLocation = storedLocation;
              }
            }
          }

          return {
            ...yacht,
            location: finalLocation,
          };
        });

        setYachts(yachtsWithLocations);

        const yachtsWithLocationCount = yachtsWithLocations.filter(
          (y) => y.location
        ).length;
        console.log(
          `${LOG_PREFIX} ✅ Initialized ${yachtsWithLocationCount}/${yachtsWithLocations.length} yachts with locations`
        );
      } catch (error) {
        console.error(`${LOG_PREFIX} ❌ Error during initialization:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <AppTabs
            yachts={yachts}
            isLoading={isLoading}
            onLocationUpdate={handleLocationUpdate}
          />
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
