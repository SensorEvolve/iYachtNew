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
import { loadYachtData } from "./src/utils/dataParser";

export type RootStackParamList = {
  Home: undefined;
  Detail: { yacht: Yacht };
  Search: { yachts: Yacht[] };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Define styles as a NativeStackNavigationOptions type
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
    // letterSpacing needs to be a number
    letterSpacing: 0.5,
  },
};

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadYachts = async () => {
      try {
        setIsLoading(true);
        const loadedYachts = await loadYachtData();
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
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
        <Stack.Screen
          name="Home"
          options={{
            title: "SUPER YACHTS",
            headerTitleStyle: {
              fontSize: 28,
              fontWeight: "700",
              color: "#2B2B2B",
              letterSpacing: 0.5, // Make sure it's a number
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
    </NavigationContainer>
  );
}
