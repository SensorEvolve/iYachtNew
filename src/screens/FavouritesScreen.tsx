import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFavorites } from "../contexts/FavoritesContext";
import { Yacht } from "../Types/yacht";
import YachtList from "../components/YachtList";

type NavigationProp = NativeStackNavigationProp<{
  Home: undefined;
  Detail: { yacht: Yacht };
  Favorites: undefined;
}>;

interface FavoritesScreenProps {
  yachts: Yacht[];
}

const FavoritesScreen: React.FC<FavoritesScreenProps> = ({ yachts }) => {
  const { favorites, toggleFavorite } = useFavorites();
  const navigation = useNavigation<NavigationProp>();

  // Filter yachts to show only favorites
  const favoriteYachts = React.useMemo(
    () => yachts.filter((yacht) => favorites.includes(yacht.id)),
    [yachts, favorites],
  );

  const handleYachtPress = React.useCallback(
    (yacht: Yacht) => {
      navigation.navigate("Detail", { yacht });
    },
    [navigation],
  );

  if (favoriteYachts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No favorites yet</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.buttonText}>Browse Yachts</Text>
        </TouchableOpacity>
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
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2B2B2B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FavoritesScreen;
