import React from "react";
import {
  createBottomTabNavigator,
  BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import the navigator components/screens for each tab
import HomeStackNavigator from "./HomeStackNavigator";
import MoreStackNavigator from "./MoreStackNavigator";
import FavoritesScreen from "../screens/FavoritesScreen";
import MapScreen from "../screens/MapScreen";

// Import types
import { RootTabParamList } from "../types/navigation";
import { Yacht } from "../types/yacht";

const Tab = createBottomTabNavigator<RootTabParamList>();

interface AppTabsProps {
  yachts: Yacht[];
  isLoading: boolean;
}

const AppTabs: React.FC<AppTabsProps> = ({ yachts, isLoading }) => {
  return (
    <Tab.Navigator
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
          let iconName: keyof typeof Ionicons.glyphMap = "ellipse-outline";

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "FavoritesTab") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "MapTab") {
            iconName = focused ? "map" : "map-outline";
          } else if (route.name === "MoreTab") {
            iconName = focused
              ? "ellipsis-horizontal"
              : "ellipsis-horizontal-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="HomeTab" options={{ title: "Home" }}>
        {() => <HomeStackNavigator yachts={yachts} isLoading={isLoading} />}
      </Tab.Screen>

      <Tab.Screen name="FavoritesTab" options={{ title: "Favorites" }}>
        {(props: BottomTabScreenProps<RootTabParamList, "FavoritesTab">) => (
          <FavoritesScreen {...props} yachts={yachts} />
        )}
      </Tab.Screen>

      {/* --- THIS IS THE FIX --- */}
      <Tab.Screen name="MapTab" options={{ title: "Live Track" }}>
        {/*
          1. We receive the standard navigation props, which now include `route`.
          2. We check if `route.params` exists and has a `focusedMmsi`.
          3. We pass these params down to the `MapScreen` component.
        */}
        {(props: BottomTabScreenProps<RootTabParamList, "MapTab">) => (
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
      {/* --- END OF FIX --- */}

      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{ title: "More" }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;
