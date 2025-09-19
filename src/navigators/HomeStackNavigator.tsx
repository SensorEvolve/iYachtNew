import React from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
  NativeStackScreenProps, // << 1. IMPORT THE PROP TYPES
} from "@react-navigation/native-stack";
import { StyleSheet } from "react-native";

// Import screens used in this stack
import HomeScreen from "../screens/HomeScreen";
import DetailScreen from "../screens/DetailScreen";
import SearchScreen from "../screens/SearchScreen";

// Import types
import { HomeStackParamList } from "../types/navigation";
import { Yacht } from "../types/yacht";

const Stack = createNativeStackNavigator<HomeStackParamList>();

// Common screen options for THIS stack
const screenOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerStyle: { backgroundColor: "#fff" },
  headerTitleStyle: { fontSize: 28, fontWeight: "600", color: "#2B2B2B" },
  headerTintColor: "#555",
};

// Props expected by this navigator component
interface HomeStackNavigatorProps {
  yachts: Yacht[];
  isLoading: boolean;
}

const HomeStackNavigator: React.FC<HomeStackNavigatorProps> = ({
  yachts,
  isLoading,
}) => {
  return (
    <Stack.Navigator initialRouteName="HomeRoot" screenOptions={screenOptions}>
      <Stack.Screen
        name="HomeRoot"
        options={({
          navigation,
        }: NativeStackScreenProps<HomeStackParamList, "HomeRoot">) => ({
          // << 2. FIX
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
          },
        })}
      >
        {/* Pass props down to HomeScreen */}
        {(
          props: NativeStackScreenProps<HomeStackParamList, "HomeRoot"> // << 3. FIX
        ) => <HomeScreen {...props} yachts={yachts} isLoading={isLoading} />}
      </Stack.Screen>
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({
          route,
        }: NativeStackScreenProps<HomeStackParamList, "Detail">) => ({
          // << 4. FIX
          title: route.params.yacht.name,
        })}
      />
      <Stack.Screen
        name="Search"
        options={{
          title: "Search",
          presentation: "modal",
          headerShown: false,
        }}
      >
        {/* Pass props down to SearchScreen */}
        {(
          props: NativeStackScreenProps<HomeStackParamList, "Search"> // << 5. FIX
        ) => <SearchScreen {...props} yachts={yachts} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

// No styles needed, but keeping the StyleSheet import is fine.
const styles = StyleSheet.create({});

export default HomeStackNavigator;
