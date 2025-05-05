// src/navigators/HomeStackNavigator.tsx
import React from "react"; // Removed useEffect, useRef
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { StyleSheet } from "react-native"; // Removed Animated, Text, TouchableOpacity, View
// Removed Ionicons as it's no longer used here

// Import screens used in this stack
import HomeScreen from "../screens/HomeScreen";
import DetailScreen from "../screens/DetailScreen";
// import MapScreen from "../screens/MapScreen"; // Removed MapScreen import
import SearchScreen from "../screens/SearchScreen";

// Import types
import { HomeStackParamList } from "../Types/NavigationParams"; // Ensure this type only includes HomeRoot, Detail, Search now
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

// --- HeaderRightButton component REMOVED ---

const HomeStackNavigator: React.FC<HomeStackNavigatorProps> = (
  { yachts, isLoading },
) => {
  // --- Animation Setup for Header Icon REMOVED ---

  return (
    // Pass initial params to HomeRoot if HomeScreen needs them directly via route.params
    <Stack.Navigator initialRouteName="HomeRoot" screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeRoot"
        options={({ navigation }) => ({ // navigation prop might not be needed now unless used elsewhere
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
          },
          // --- headerRight REMOVED ---
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
      {/* --- Map Stack.Screen REMOVED --- */}
      {/* The Map screen is now likely accessed via AppTabs, not this stack */}
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

// Styles needed for the header button REMOVED
const styles = StyleSheet.create({
  // Empty now, can be removed if nothing else needs styles here
});

export default HomeStackNavigator;
