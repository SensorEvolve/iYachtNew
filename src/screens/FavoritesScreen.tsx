import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFavorites } from "../contexts/FavoritesContext";
import YachtList from "../components/YachtList";
import { useNavigation } from "@react-navigation/native"; // Removed CompositeNavigationProp
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { Yacht } from "../types/yacht";
import { RootTabParamList, HomeStackParamList } from "../types/navigation";

// FINAL FIX: Manually combine the two navigation types using '&'
type FavoritesScreenNavigationProp = BottomTabNavigationProp<
  RootTabParamList,
  "FavoritesTab"
> &
  NativeStackNavigationProp<HomeStackParamList>;

const FavoritesScreen: React.FC<{ yachts: Yacht[] }> = ({ yachts }) => {
  const navigation = useNavigation<FavoritesScreenNavigationProp>();
  const { favorites } = useFavorites();

  const favoriteYachts = yachts.filter((yacht) => {
    return favorites.includes(String(yacht.id));
  });

  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  if (favoriteYachts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No Favorites Yet</Text>
        <Text style={styles.emptySubText}>
          Tap the heart icon on any yacht to add it here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <YachtList yachts={favoriteYachts} onYachtPress={handleYachtPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  emptySubText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default FavoritesScreen;
