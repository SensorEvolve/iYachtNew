// src/navigators/HomeStackNavigator.tsx
import React, { useEffect, useRef } from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import screens used in this stack
import HomeScreen from "../screens/HomeScreen";
import DetailScreen from "../screens/DetailScreen";
import MapScreen from "../screens/MapScreen";
import SearchScreen from "../screens/SearchScreen";

// Import types
import { HomeStackParamList } from "../Types/NavigationParams";
import { Yacht } from "../Types/yacht";

const Stack = createNativeStackNavigator<HomeStackParamList>();

// Common screen options for THIS stack
const screenOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerStyle: { backgroundColor: "#fff" },
  headerTitleStyle: { fontSize: 28, fontWeight: "600", color: "#2B2B2B" },
  headerTintColor: "#555", // Color for back button
};

// Props expected by this navigator component
interface HomeStackNavigatorProps {
  yachts: Yacht[];
  isLoading: boolean;
}

// Header button component (extracted for clarity)
const HeaderRightButton = (
  { navigation, pulseAnim }: { navigation: any; pulseAnim: Animated.Value },
) => (
  <TouchableOpacity
    onPress={() =>
      navigation.navigate("Map", {
        yachts: navigation.getState().routes.find((r: any) =>
          r.name === "HomeRoot"
        )?.params?.yachts || [],
      })} // Pass yachts to map
    style={styles.headerButtonWrapper}
    accessibilityLabel="Go to Live Tracking Map"
  >
    <Animated.View
      style={[styles.headerButtonContainer, {
        transform: [{ scale: pulseAnim }],
      }]}
    >
      <Ionicons name="map-outline" size={26} color="#000" />
      <Text style={styles.headerButtonText}>LIVE</Text>
      <Text style={styles.headerButtonText}>TRACK</Text>
    </Animated.View>
  </TouchableOpacity>
);

const HomeStackNavigator: React.FC<HomeStackNavigatorProps> = (
  { yachts, isLoading },
) => {
  // --- Animation Setup for Header Icon ---
  // Kept within this navigator as it's only used here now
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
    // Pass initial params to HomeRoot if HomeScreen needs them directly via route.params
    <Stack.Navigator initialRouteName="HomeRoot" screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeRoot"
        options={({ navigation }) => ({
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
          },
          // NO headerLeft for Credits here anymore
          headerRight: () => (
            <HeaderRightButton navigation={navigation} pulseAnim={pulseAnim} />
          ),
        })}
        // Pass props via component prop or render prop as before
        // Using component prop is cleaner if no complex render logic needed
      >
        {/* Pass props down to HomeScreen */}
        {(props) => (
          <HomeScreen {...props} yachts={yachts} isLoading={isLoading} />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({ title: route.params.yacht.name })}
      />
      <Stack.Screen
        name="Map"
        options={{ title: "Live Tracking" }}
      >
        {/* MapScreen receives yachts via route params now */}
        {(props) => <MapScreen {...props} yachts={props.route.params.yachts} />}
      </Stack.Screen>
      <Stack.Screen
        name="Search"
        options={{
          title: "Search",
          presentation: "modal", // Present Search modally (optional, but fits its design)
          headerShown: false, // Hide header for the modal search
        }}
      >
        {/* Pass props down to SearchScreen */}
        {(props) => <SearchScreen {...props} yachts={yachts} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// Styles needed for the header button
const styles = StyleSheet.create({
  headerButtonWrapper: {
    marginRight: 20,
  },
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

export default HomeStackNavigator;
