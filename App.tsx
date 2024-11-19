import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// Screens
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import MapScreen from "./src/screens/MapScreen";
import MainLayout from "./src/components/MainLayout";

// Types & Services
import { RootStackParamList } from "./src/Types/navigation";
import { Yacht } from "./src/Types/yacht";
import { loadYachtData } from "./src/utils/dataParser";
import { locationService } from "./src/services/YachtLocationService";
import { YachtSelectionProvider } from "./src/contexts/YachtSelectionContext";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await locationService.waitForInitialization();
        const loadedYachts = await loadYachtData();
        setYachts(loadedYachts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading yacht data...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <YachtSelectionProvider>
          <FavoritesProvider>
            <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                  headerShadowVisible: false,
                  headerBackTitleVisible: false,
                  headerStyle: {
                    backgroundColor: "#fff",
                  },
                  headerTitleStyle: {
                    fontSize: 28,
                    fontWeight: "600",
                    color: "#2B2B2B",
                  },
                }}
              >
                <Stack.Screen
                  name="Home"
                  options={({ navigation }) => ({
                    title: "SUPER YACHTS",
                    headerRight: () => (
                      <TouchableOpacity
                        onPress={() => navigation.navigate("Map")}
                        style={{ marginRight: 15 }}
                      >
                        <Ionicons name="globe-outline" size={24} color="#000" />
                      </TouchableOpacity>
                    ),
                  })}
                >
                  {(props) => <HomeScreen {...props} yachts={yachts} />}
                </Stack.Screen>

                <Stack.Screen
                  name="Map"
                  options={{ title: "Live Tracking" }}
                >
                  {(props) => (
                    <MainLayout yachts={yachts}>
                      <MapScreen {...props} yachts={yachts} />
                    </MainLayout>
                  )}
                </Stack.Screen>

                <Stack.Screen
                  name="Detail"
                  component={DetailScreen}
                  options={({ route }) => ({
                    title: route.params.yacht.name,
                  })}
                />

                <Stack.Screen name="Search">
                  {(props) => <SearchScreen {...props} yachts={yachts} />}
                </Stack.Screen>

                <Stack.Screen name="Favorites">
                  {(props) => <FavoritesScreen {...props} yachts={yachts} />}
                </Stack.Screen>
              </Stack.Navigator>
            </NavigationContainer>
          </FavoritesProvider>
        </YachtSelectionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
