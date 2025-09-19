// src/navigators/MoreStackNavigator.tsx
import React from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";

// Import screens for this stack
import MoreScreen from "../screens/MoreScreen";
import AboutScreen from "../screens/AboutScreen";
import CreditsScreen from "../screens/CreditsScreen";

// Import types
import { MoreStackParamList } from "../types/navigation";

const Stack = createNativeStackNavigator<MoreStackParamList>();

// Optional: Common screen options for this stack
const screenOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerBackTitleVisible: false,
  headerStyle: { backgroundColor: "#fff" },
  headerTitleStyle: { fontSize: 18, fontWeight: "600", color: "#2B2B2B" }, // Slightly smaller title
  headerTintColor: "#555",
};

const MoreStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {/* Set initial route if needed, default is first screen */}
      <Stack.Screen
        name="MoreList"
        component={MoreScreen}
        options={{ title: "More Options" }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ title: "About App" }}
      />
      <Stack.Screen
        name="Credits"
        component={CreditsScreen}
        options={{ title: "Image Credits" }}
      />
      {/* Add Settings screen here if you create one */}
    </Stack.Navigator>
  );
};

export default MoreStackNavigator;
