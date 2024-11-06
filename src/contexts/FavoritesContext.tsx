import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "@favorites";

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites when component mounts
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          setFavorites(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load favorites:", e);
      }
    };
    loadFavorites();
  }, []);

  // Save favorites whenever they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        console.log("Favorites saved:", favorites); // Debug log
      } catch (e) {
        console.error("Failed to save favorites:", e);
      }
    };
    saveFavorites(); // Always save, regardless of length
  }, [favorites]);

  const toggleFavorite = async (id: string) => {
    setFavorites((current) => {
      const newFavorites = current.includes(id)
        ? current.filter((fav) => fav !== id)
        : [...current, id];
      console.log("Toggling favorite:", id, "New favorites:", newFavorites); // Debug log
      return newFavorites;
    });
  };

  const isFavorite = (id: string) => favorites.includes(id);

  return (
    <FavoritesContext.Provider
      value={{ favorites, toggleFavorite, isFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
};

export default FavoritesContext;
