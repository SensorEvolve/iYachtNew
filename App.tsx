import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator, NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, Alert } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import FavoritesScreen from "./src/screens/FavoritesScreen";
import MainLayout from "./src/components/MainLayout";
import { FavoritesProvider } from "./src/contexts/FavoritesContext";
import { YachtSelectionProvider } from "./src/contexts/YachtSelectionContext";
import { loadYachtData } from "./src/utils/dataParser";
import { RootStackParamList } from "./src/Types/navigation";
import { locationService } from "./src/services/YachtLocationService";
import { Yacht } from "./src/Types/yacht";

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: 'transparent',
  },
  headerTransparent: true,
  headerBlurEffect: 'regular' as 'regular',
  headerTitleStyle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2B2B2B',
  },
};

const LoadingScreen = () => (
  <View style={styles.centerContainer}>
    <ActivityIndicator size="large" color="#000" />
    <Text style={styles.loadingText}>Loading yacht data...</Text>
  </View>
);

const ErrorScreen = ({ error, retry }: { error: string; retry: () => void }) => (
  <View style={styles.centerContainer}>
    <Text style={styles.errorText}>Error: {error}</Text>
    <TouchableOpacity style={styles.retryButton} onPress={retry}>
      <Text style={styles.retryText}>Retry</Text>
    </TouchableOpacity>
  </View>
);

export default function App() {
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await locationService.waitForInitialization();
      const loadedYachts = await loadYachtData();
      setYachts(loadedYachts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      Alert.alert(
        "Loading Error",
        "Failed to load yacht data. Would you like to retry?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Retry", onPress: () => loadAppData() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  if (error) {
    return <ErrorScreen error={error} retry={loadAppData} />;
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <YachtSelectionProvider>
          <FavoritesProvider>
            <NavigationContainer>
              <MainLayout yachts={yachts}>
                <Stack.Navigator screenOptions={screenOptions}>
                  <Stack.Screen
                    name="Home"
                    options={{ title: "SUPER YACHTS" }}
                  >
                    {(props) => (
                      <HomeScreen {...props} yachts={yachts} isLoading={isLoading} />
                    )}
                  </Stack.Screen>

                  <Stack.Screen
                    name="Detail"
                    options={({ route }) => ({
                      title: route.params.yacht.name,
                    })}
                    component={DetailScreen}
                  />

                  <Stack.Screen
                    name="Search"
                    options={{ title: "Search" }}
                  >
                    {(props) => <SearchScreen {...props} yachts={yachts} />}
                  </Stack.Screen>

                  <Stack.Screen
                    name="Favorites"
                    options={{ title: "Favorites" }}
                  >
                    {(props) => <FavoritesScreen {...props} yachts={yachts} />}
                  </Stack.Screen>
                </Stack.Navigator>
              </MainLayout>
            </NavigationContainer>
          </FavoritesProvider>
        </YachtSelectionProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    padding: 12,
    backgroundColor: "#000",
    borderRadius: 8,
    minWidth: 120,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});
