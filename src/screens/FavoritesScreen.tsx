import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useFavorites } from "../contexts/FavoritesContext";
import YachtList from "../components/YachtList";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Yacht } from "../Types/yacht";
import { RootStackParamList } from "../Types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const FavoritesScreen: React.FC<{ yachts: Yacht[] }> = ({ yachts }) => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites } = useFavorites();

  console.log('=== FavoritesScreen Debug ===');
  console.log('Received yachts count:', yachts?.length);
  console.log('Favorites from context:', favorites);

  const favoriteYachts = yachts.filter((yacht) => {
    // Convert yacht.id to string for comparison
    const yachtIdString = String(yacht.id);
    const isIncluded = favorites.includes(yachtIdString);
    console.log(`Checking yacht ${yacht.id} (${typeof yacht.id}) against favorites:`, isIncluded);
    return isIncluded;
  });

  console.log('Filtered yachts count:', favoriteYachts.length);
  console.log('Filtered yacht IDs:', favoriteYachts.map(y => y.id));

  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  if (favoriteYachts.length === 0) {
    console.log('Rendering empty state');
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No favorite yachts yet</Text>
        <Text style={styles.emptySubText}>
          Tap the heart icon on any yacht details to add it to your favorites
        </Text>
      </View>
    );
  }

  console.log('Rendering yacht list with favorites');
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
