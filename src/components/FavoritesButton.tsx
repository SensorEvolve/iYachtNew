import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../contexts/FavoritesContext";

interface FavoritesButtonProps {
  yachtId: string;
  size?: number;
}

export const FavoritesButton: React.FC<FavoritesButtonProps> = ({
  yachtId,
  size = 30,
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(yachtId);

  console.log("=== FavoritesButton Debug ===");
  console.log("Yacht ID:", yachtId);
  console.log("Is Favorite:", isCurrentlyFavorite);

  const handlePress = () => {
    console.log("Button pressed for yacht:", yachtId);
    toggleFavorite(yachtId);
    console.log("After toggle attempt");
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{ padding: 8 }}
    >
      <Ionicons
        name={isCurrentlyFavorite ? "heart" : "heart-outline"}
        size={size}
        color={isCurrentlyFavorite ? "#ff4757" : "#666"}
      />
    </TouchableOpacity>
  );
};
