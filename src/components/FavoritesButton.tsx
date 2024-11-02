import React from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "../contexts/FavoritesContext";

interface FavoriteButtonProps {
  yachtId: string;
  size?: number;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  yachtId,
  size = 30,
}) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const isCurrentlyFavorite = isFavorite(yachtId);

  return (
    <TouchableOpacity
      onPress={() => toggleFavorite(yachtId)}
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
