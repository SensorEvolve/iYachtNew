import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import { Yacht } from "./src/Types/yacht";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";
import { initDatabase, migrateData, getYachts } from "./src/utils/db";

export type RootStackParamList = {
  Home: undefined;
  Detail: { yacht: Yacht };
  Search: { yachts: Yacht[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerStyle: {
    backgroundColor: "#fff",
  },
  headerTitleStyle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#2B2B2B",
    letterSpacing: 0.5,
  },
};

function AppNavigator({
  yachts,
  isLoading,
}: {
  yachts: Yacht[];
  isLoading: boolean;
}) {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        options={{
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
          },
        }}
      >
        {(props) => (
          <HomeScreen {...props} yachts={yachts} isLoading={isLoading} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Search"
        options={{
          title: "Search",
        }}
      >
        {(props) => <SearchScreen {...props} />}
      </Stack.Screen>
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({
          title: route.params.yacht.name,
        })}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database and migrate data
  useEffect(() => {
    const initializeDb = async () => {
      try {
        await initDatabase();
        await migrateData();
        setDbInitialized(true);
      } catch (error) {
        console.error("Database initialization error:", error);
        // You might want to show an error message to the user here
      }
    };
    initializeDb();
  }, []);

  // Load yachts from SQLite after DB is initialized
  useEffect(() => {
    const loadYachts = async () => {
      if (!dbInitialized) return;

      try {
        setIsLoading(true);
        const loadedYachts = await getYachts();
        setYachts(loadedYachts);
      } catch (error) {
        console.error("Error loading yachts:", error);
        // You might want to show an error message to the user here
      } finally {
        setIsLoading(false);
      }
    };

    loadYachts();
  }, [dbInitialized]);

  // Reload yachts when app comes to foreground
  useEffect(() => {
    const reloadOnFocus = async () => {
      if (!dbInitialized) return;

      try {
        const loadedYachts = await getYachts();
        setYachts(loadedYachts);
      } catch (error) {
        console.error("Error reloading yachts:", error);
      }
    };

    // Add focus listener
    const unsubscribe = (NavigationContainer as any)?.getCurrentFocusListener?.(
      reloadOnFocus,
    );

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dbInitialized]);

  return (
    <FavoritesProvider>
      <NavigationContainer>
        <AppNavigator yachts={yachts} isLoading={isLoading} />
      </NavigationContainer>
    </FavoritesProvider>
  );
}
