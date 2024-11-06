import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { Yacht } from "./src/Types/yacht";
import { loadYachtData } from "./src/utils/dataParser";
import { RootStackParamList } from "./src/Types/navigation";

const Stack = createNativeStackNavigator<RootStackParamList>();

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
    letterSpacing: 0.5,
  },
};

function AppNavigator({
  yachts,
  isLoading,
}: {
  yachts: Yacht[];
  isLoading: boolean;
}) {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        options={{
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
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
      <Stack.Screen
        name="Favorites"
        options={{
          title: "Favorites",
        }}
      >
        {(props) => <FavoritesScreen {...props} yachts={yachts} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

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
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator yachts={yachts} isLoading={isLoading} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
