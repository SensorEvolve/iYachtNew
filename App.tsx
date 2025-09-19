// App.tsx (Main App Component - Updated)
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";
import { loadYachtData } from "./src/utils/dataParser";
import { Yacht } from "./src/types/yacht";
import AppTabs from "./src/navigators/AppTabs"; // Import the new Tab Navigator

// You might want to add a loading indicator view
// import { ActivityIndicator, View } from 'react-native';

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadYachts = async () => {
      try {
        setIsLoading(true);
        const loadedYachts = await loadYachtData();
        console.log("Loaded yachts count:", loadedYachts.length);
        setYachts(loadedYachts);
      } catch (error) {
        console.error("Error loading yachts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadYachts();
  }, []);

  // Optional: Basic loading state
  // if (isLoading) {
  //  return (
  //    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
  //      <ActivityIndicator size="large" color="#007AFF"/>
  //    </View>
  //   );
  // }

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          {/* Render the Tab navigator, passing necessary data */}
          {/* Only render tabs when data is ready to avoid passing empty arrays */}
          {!isLoading && <AppTabs yachts={yachts} isLoading={isLoading} />}
          {/* Or keep rendering and let screens handle loading state */}
          {/* <AppTabs yachts={yachts} isLoading={isLoading} /> */}
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
