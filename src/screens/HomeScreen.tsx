import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import YachtList from "../components/YachtList";
import { Yacht } from "../Types/yacht";
import { Ionicons } from "@expo/vector-icons";
import {
  SizeIcon,
  SpeedometerIcon,
  PriceIcon,
  SeizedIcon,
} from "../components/icons/CustomIcons";

interface Props extends NativeStackScreenProps<RootStackParamList, "Home"> {
  yachts: Yacht[];
  isLoading: boolean;
}

const HomeScreen: React.FC<Props> = ({ navigation, yachts, isLoading }) => {
  const [filters, setFilters] = useState({
    byLength: false,
    bySpeed: false,
    byPrice: false,
    bySeized: false,
    byFavorites: false,
  });

  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  const parseNumericValue = (value: string): number => {
    const numericString = value.replace(/[^\d.]/g, "");
    const parsedValue = parseFloat(numericString);
    return isNaN(parsedValue) ? 0 : parsedValue;
  };

  const getFilteredYachts = () => {
    let filtered = [...yachts];

    if (filters.byLength) {
      filtered.sort((a, b) => {
        const lengthA = parseNumericValue(a.length);
        const lengthB = parseNumericValue(b.length);
        return lengthB - lengthA;
      });
    }

    if (filters.bySpeed) {
      filtered.sort((a, b) => {
        const speedA = parseNumericValue(a.topSpeed);
        const speedB = parseNumericValue(b.topSpeed);
        return speedB - speedA;
      });
    }

    if (filters.byPrice) {
      filtered.sort((a, b) => {
        const priceA = parseNumericValue(a.price);
        const priceB = parseNumericValue(b.price);
        return priceB - priceA;
      });
    }

    if (filters.bySeized) {
      filtered = filtered.filter(
        (yacht) => yacht.seizedBy && yacht.seizedBy.trim() !== "",
      );
    }

    if (filters.byFavorites) {
      filtered = filtered.filter((yacht) => yacht.isFavorite);
    }

    return filtered;
  };

  // Filter toggle handlers
  const toggleLengthFilter = () => {
    setFilters((prev) => ({
      ...prev,
      byLength: !prev.byLength,
      bySpeed: false,
      byPrice: false,
      bySeized: false,
      byFavorites: false,
    }));
  };

  const toggleSpeedFilter = () => {
    setFilters((prev) => ({
      ...prev,
      byLength: false,
      bySpeed: !prev.bySpeed,
      byPrice: false,
      bySeized: false,
      byFavorites: false,
    }));
  };

  const togglePriceFilter = () => {
    setFilters((prev) => ({
      ...prev,
      byLength: false,
      bySpeed: false,
      byPrice: !prev.byPrice,
      bySeized: false,
      byFavorites: false,
    }));
  };

  const toggleSeizedFilter = () => {
    setFilters((prev) => ({
      ...prev,
      byLength: false,
      bySpeed: false,
      byPrice: false,
      bySeized: !prev.bySeized,
      byFavorites: false,
    }));
  };

  const toggleFavoritesFilter = () => {
    setFilters((prev) => ({
      ...prev,
      byLength: false,
      bySpeed: false,
      byPrice: false,
      bySeized: false,
      byFavorites: !prev.byFavorites,
    }));
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              onPress={toggleLengthFilter}
              style={[
                styles.filterButton,
                filters.byLength && styles.activeFilter,
              ]}
            >
              <SizeIcon size={30} color={filters.byLength ? "#000" : "#666"} />
              {filters.byLength && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSpeedFilter}
              style={[
                styles.filterButton,
                filters.bySpeed && styles.activeFilter,
              ]}
            >
              <SpeedometerIcon
                size={30}
                color={filters.bySpeed ? "#000" : "#666"}
              />
              {filters.bySpeed && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePriceFilter}
              style={[
                styles.filterButton,
                filters.byPrice && styles.activeFilter,
              ]}
            >
              <PriceIcon size={30} color={filters.byPrice ? "#000" : "#666"} />
              {filters.byPrice && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSeizedFilter}
              style={[
                styles.filterButton,
                filters.bySeized && styles.activeFilter,
              ]}
            >
              <SeizedIcon
                size={30}
                color={filters.bySeized ? "#000" : "#666"}
              />
              {filters.bySeized && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFavoritesFilter}
              style={[
                styles.filterButton,
                filters.byFavorites && styles.activeFilter,
              ]}
            >
              <Ionicons
                name={filters.byFavorites ? "heart" : "heart-outline"}
                size={30}
                color={filters.byFavorites ? "#000" : "#666"}
              />
              {filters.byFavorites && <View style={styles.underline} />}
            </TouchableOpacity>
          </View>

          <YachtList
            yachts={getFilteredYachts()}
            onYachtPress={handleYachtPress}
          />

          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate("Search", { yachts })}
          >
            <Ionicons name="search" size={30} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingVertical: 12, // Increased to accommodate larger icons
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: 2,
  },
  filterButton: {
    padding: 12, // Increased to accommodate larger icons
    alignItems: "center",
    position: "relative",
  },
  activeFilter: {
    // Additional styling for active state if needed
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 5,
    right: 5,
    height: 2,
    backgroundColor: "#000",
    borderRadius: 1,
  },
  searchButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HomeScreen;
