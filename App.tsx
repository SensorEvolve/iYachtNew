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
import FavoritesScreen from "./src/screens/FavoritesScreen";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Yacht } from "./src/Types/yacht";
import { loadYachtData } from "./src/utils/dataParser";
import { RootStackParamList } from "./src/Types/navigation";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";

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
        options={({ navigation }) => ({
          title: "SUPER YACHTS",
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: "700",
            color: "#2B2B2B",
            letterSpacing: 0.5,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("Favorites")}
              style={{ marginRight: 15, opacity: 0 }} // Set opacity to 0 to hide it
            >
              <Ionicons name="heart-outline" size={24} color="#000" />
            </TouchableOpacity>
          ),
        })}
      >
        {(props) => (
          <HomeScreen
            {...props}
            yachts={yachts}
            isLoading={isLoading}
            onFavoritesPress={() => props.navigation.navigate("Favorites")}
          />
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
        {(props) => (
          <FavoritesScreen {...props} yachts={yachts} />
        )}
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
        console.log("Loaded yachts count:", loadedYachts.length);
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
      <FavoritesProvider>
        <NavigationContainer>
          <AppNavigator yachts={yachts} isLoading={isLoading} />
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
