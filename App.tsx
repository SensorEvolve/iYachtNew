import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShadowVisible: false,
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          options={{
            title: "Super Yachts",
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
