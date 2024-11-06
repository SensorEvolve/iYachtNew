import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as FavoritesContext from "../contexts/FavoritesContext";
import YachtList from "../components/YachtList";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Yacht } from "../Types/yacht";
import { RootStackParamList } from "../Types/navigation";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const FavoritesScreen: React.FC<{ yachts: Yacht[] }> = ({ yachts }) => {
  const navigation = useNavigation<NavigationProp>();
  const { favorites } = FavoritesContext.useFavorites();
  const favoriteYachts = yachts.filter((yacht) => favorites.includes(yacht.id));

  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  if (favoriteYachts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No favorite yachts yet</Text>
        <Text style={styles.emptySubText}>
          Tap the heart icon on any yacht to add it to your favorites
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
