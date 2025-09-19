import React from "react";
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import HomeStackNavigator from "./HomeStackNavigator";
import MoreStackNavigator from "./MoreStackNavigator";
import FavoritesScreen from "../screens/FavoritesScreen";
import MapScreen from "../screens/MapScreen";
import { RootTabParamList } from "../types/navigation"; // Ensure path is correct
import { Yacht } from "../types/yacht";

const Tab = createBottomTabNavigator<RootTabParamList>();

interface AppTabsProps {
  yachts: Yacht[];
  isLoading: boolean;
}

const AppTabs: React.FC<AppTabsProps> = ({ yachts, isLoading }) => {
  return (
    // Set the initial route to "HomeTab", which is now the map
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }: BottomTabScreenProps<RootTabParamList>) => ({
        headerShown: false,
        tabBarIcon: ({
          focused,
          color,
          size,
        }: {
          focused: boolean;
          color: string;
          size: number;
        }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          // Updated icons for the new tab names
          if (route.name === "HomeTab") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "BrowseTab") {
            iconName = focused ? "list-circle" : "list-circle-outline";
          } else if (route.name === "FavoritesTab") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "MoreTab") {
            iconName = focused
              ? "ellipsis-horizontal"
              : "ellipsis-horizontal-outline";
          } else {
            iconName = "ellipse-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      {/* --- REORDERED TABS --- */}
      {/* 1. The Map is now the first tab and is named "HomeTab" */}
      <Tab.Screen name="HomeTab" options={{ title: "Live Map" }}>
        {(props: BottomTabScreenProps<RootTabParamList, "HomeTab">) => (
          <MapScreen
            {...props}
            route={{
              ...props.route,
              params: { focusedMmsi: props.route.params?.focusedMmsi },
            }}
            yachts={yachts}
          />
        )}
      </Tab.Screen>

      {/* 2. The Yacht List is now the second tab, named "BrowseTab" */}
      <Tab.Screen name="BrowseTab" options={{ title: "Browse" }}>
        {() => <HomeStackNavigator yachts={yachts} isLoading={isLoading} />}
      </Tab.Screen>

      {/* 3. Favorites Tab */}
      <Tab.Screen name="FavoritesTab" options={{ title: "Favorites" }}>
        {(props: BottomTabScreenProps<RootTabParamList, "FavoritesTab">) => (
          <FavoritesScreen {...props} yachts={yachts} />
        )}
      </Tab.Screen>

      {/* 4. More Tab */}
      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{ title: "More" }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;
