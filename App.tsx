import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import MapScreen from "./src/screens/MapScreen";
import {
  TouchableOpacity,
  ActivityIndicator,
  View,
  StyleSheet,
  Text,
  LogBox,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Yacht } from "./src/Types/yacht";
import { loadYachtData } from "./src/utils/dataParser";
import { RootStackParamList } from "./src/Types/navigation";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";
import { locationService } from "./src/services/YachtLocationService";

const Stack = createNativeStackNavigator<RootStackParamList>();
const LOG_PREFIX = "🚀 [App]";

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
  },
};

const LoadingScreen = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#000" />
    <Text style={styles.loadingText}>Loading yacht data...</Text>
  </View>
);

const ErrorScreen = ({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>Error: {error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={retry}>
      <Text style={styles.retryText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

interface AppNavigatorProps {
  yachts: Yacht[];
  isLoading: boolean;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ yachts, isLoading }) => {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        options={({ navigation }) => ({
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Map", {})}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="globe-outline" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      >
        {(props: NativeStackScreenProps<RootStackParamList, "Home">) => (
          <HomeScreen {...props} yachts={yachts} isLoading={isLoading} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Map" options={{ title: "Live Tracking" }}>
        {(props: NativeStackScreenProps<RootStackParamList, "Map">) => (
          <MapScreen {...props} yachts={yachts} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Search" options={{ title: "Search" }}>
        {(props: NativeStackScreenProps<RootStackParamList, "Search">) => (
          <SearchScreen {...props} yachts={yachts} />
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Detail"
        options={({ route }) => ({
          title: route.params.yacht.name,
        })}
      >
        {(props: NativeStackScreenProps<RootStackParamList, "Detail">) => (
          <DetailScreen {...props} />
        )}
      </Stack.Screen>

      <Stack.Screen name="Favorites" options={{ title: "Favorites" }}>
        {(props: NativeStackScreenProps<RootStackParamList, "Favorites">) => (
          <FavoritesScreen {...props} yachts={yachts} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppData = async () => {
    console.log(`${LOG_PREFIX} Starting app initialization`);
    setIsLoading(true);
    setError(null);

    try {
      await locationService.waitForInitialization();
      console.log(`${LOG_PREFIX} Location service initialized`);

      const loadedYachts = await loadYachtData();
      console.log(`${LOG_PREFIX} Loaded ${loadedYachts.length} yachts`);
      setYachts(loadedYachts);
    } catch (err) {
      console.error(`${LOG_PREFIX} Initialization error:`, err);
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      Alert.alert(
        "Loading Error",
        "Failed to load yacht data. Would you like to retry?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: () => loadAppData() },
        ],
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
    return () => {
      // Cleanup if needed
    };
  }, []);

  if (error) {
    return <ErrorScreen error={error} retry={loadAppData} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <AppNavigator yachts={yachts} isLoading={isLoading} />
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    backgroundColor: "#000",
    borderRadius: 8,
    minWidth: 120,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
