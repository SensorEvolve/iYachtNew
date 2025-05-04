// src/navigators/AppTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

// Import the navigator components/screens for each tab
import HomeStackNavigator from "./HomeStackNavigator";
import MoreStackNavigator from "./MoreStackNavigator";
import FavoritesScreen from "../screens/FavoritesScreen";

// Import types
import { RootTabParamList } from "../Types/NavigationParams";
import { Yacht } from "../Types/yacht";

const Tab = createBottomTabNavigator<RootTabParamList>();

// Props needed if data is loaded high up (like in App.tsx)
interface AppTabsProps {
  yachts: Yacht[];
  isLoading: boolean;
}

const AppTabs: React.FC<AppTabsProps> = ({ yachts, isLoading }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // We manage headers inside the nested Stack Navigators
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "ellipse-outline"; // Default icon

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "FavoritesTab") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "MoreTab") {
            iconName = focused
              ? "ellipsis-horizontal"
              : "ellipsis-horizontal-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF", // Example active color
        tabBarInactiveTintColor: "gray", // Example inactive color
        tabBarStyle: { // Optional: Add styles to the tab bar
          // backgroundColor: '#fff',
          // borderTopColor: '#eee',
        },
        tabBarLabelStyle: { // Optional: Style the text label
          // fontSize: 12,
        },
      })}
    >
      {/* Define Tabs - Order: Home, Favorites, More */}
      <Tab.Screen name="HomeTab" options={{ title: "Home" }}>
        {/* Pass props down to the HomeStackNavigator */}
        {() => <HomeStackNavigator yachts={yachts} isLoading={isLoading} />}
      </Tab.Screen>

      <Tab.Screen name="FavoritesTab" options={{ title: "Favorites" }}>
        {/* FavoritesScreen needs yachts prop */}
        {(props) => <FavoritesScreen {...props} yachts={yachts} />}
      </Tab.Screen>

      <Tab.Screen
        name="MoreTab"
        component={MoreStackNavigator}
        options={{ title: "More" }}
      />
    </Tab.Navigator>
  );
};

export default AppTabs;
