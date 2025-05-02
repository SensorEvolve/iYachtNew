import React, { useEffect, useState, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
// Import Text component
import { TouchableOpacity, Animated, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Screen & Util Imports
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import MapScreen from "./src/screens/MapScreen";
import { Yacht } from "./src/Types/yacht";
import { loadYachtData } from "./src/utils/dataParser";
import { RootStackParamList } from "./src/Types/navigation";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Common screen options
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

interface AppNavigatorProps {
  yachts: Yacht[];
  isLoading: boolean;
}

// Navigator Component
const AppNavigator: React.FC<AppNavigatorProps> = ({ yachts, isLoading }) => {
  // --- Animation Setup for Header Icon ---
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.delay(1000),
      ]),
    ).start();
  }, [pulseAnim]);
  // --- End Animation Setup ---

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
              onPress={() => navigation.navigate("Map")}
              // *** Increased marginRight for more space ***
              style={{ marginRight: 20 }} // <-- Changed from 15 to 20
              accessibilityLabel="Go to Live Tracking Map"
            >
              <Animated.View
                style={[styles.headerButtonContainer, { transform: [{ scale: pulseAnim }] }]}
              >
                <Ionicons
                  name="map-outline"
                  size={26}
                  color="#000" // Black color
                />
                <Text style={styles.headerButtonText}>LIVE</Text>
                <Text style={styles.headerButtonText}>TRACK</Text>
              </Animated.View>
            </TouchableOpacity>
          ),
        })}
      >
        {(props: NativeStackScreenProps<RootStackParamList, "Home">) => (
          <HomeScreen {...props} yachts={yachts} isLoading={isLoading} />
        )}
      </Stack.Screen>

      {/* Other Screens */}
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
      <Stack.Screen name="Detail" options={({ route }) => ({ title: route.params.yacht.name })}>
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

// Main App Component (loads data)
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

// StyleSheet for the header button text
const styles = StyleSheet.create({
  headerButtonContainer: {
    alignItems: "center",
  },
  headerButtonText: {
    color: "red",
    fontSize: 9,
    fontWeight: "bold",
    lineHeight: 10,
    marginTop: -1,
  },
});
