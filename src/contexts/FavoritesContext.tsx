import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FavoriteState, FavoriteAction } from "../types/yacht";

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
  addFavorite: () => {},
  removeFavorite: () => {},
});

const FAVORITES_STORAGE_KEY = "@super_yachts_favorites";

const favoritesReducer = (
  state: FavoriteState,
  action: FavoriteAction
): FavoriteState => {
  console.log("=== Reducer Debug ===");
  console.log("Current state:", state);
  console.log("Action:", action);

  switch (action.type) {
    case "ADD_FAVORITE":
      if (state.favorites.includes(action.id)) {
        return state;
      }
      const newState = {
        ...state,
        favorites: [...state.favorites, action.id],
      };
      console.log("New state after ADD:", newState);
      return newState;

    case "REMOVE_FAVORITE":
      const afterRemove = {
        ...state,
        favorites: state.favorites.filter((id) => id !== action.id),
      };
      console.log("New state after REMOVE:", afterRemove);
      return afterRemove;

    case "TOGGLE_FAVORITE":
      const afterToggle = {
        ...state,
        favorites: state.favorites.includes(action.id)
          ? state.favorites.filter((id) => id !== action.id)
          : [...state.favorites, action.id],
      };
      console.log("New state after TOGGLE:", afterToggle);
      return afterToggle;

    case "SET_FAVORITES":
      console.log("Setting favorites:", action.favorites);
      return {
        ...state,
        favorites: action.favorites,
      };

    default:
      return state;
  }
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(favoritesReducer, { favorites: [] });

  // Load favorites from storage on mount
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        console.log("Loading favorites from storage");
        const storedFavorites = await AsyncStorage.getItem(
          FAVORITES_STORAGE_KEY
        );
        console.log("Stored favorites:", storedFavorites);
        if (storedFavorites) {
          dispatch({
            type: "SET_FAVORITES",
            favorites: JSON.parse(storedFavorites),
          });
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
      }
    };

    loadFavorites();
  }, []);

  // Save favorites to storage whenever they change
  useEffect(() => {
    const saveFavorites = async () => {
      try {
        console.log("Saving favorites to storage:", state.favorites);
        await AsyncStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(state.favorites)
        );
        console.log("Favorites saved successfully");
      } catch (error) {
        console.error("Error saving favorites:", error);
      }
    };

    saveFavorites();
  }, [state.favorites]);

  const toggleFavorite = (id: string) => {
    console.log("Toggling favorite for:", id);
    dispatch({ type: "TOGGLE_FAVORITE", id });
  };

  const isFavorite = (id: string) => {
    const result = state.favorites.includes(id);
    console.log("Checking if favorite:", id, result);
    return result;
  };

  const addFavorite = (id: string) => {
    console.log("Adding favorite:", id);
    dispatch({ type: "ADD_FAVORITE", id });
  };

  const removeFavorite = (id: string) => {
    console.log("Removing favorite:", id);
    dispatch({ type: "REMOVE_FAVORITE", id });
  };

  const value = {
    favorites: state.favorites,
    toggleFavorite,
    isFavorite,
    addFavorite,
    removeFavorite,
  };

  console.log("FavoritesProvider current value:", value);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
