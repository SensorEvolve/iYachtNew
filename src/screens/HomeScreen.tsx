import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

// --- Import your project-specific types and components ---
import type { HomeStackParamList } from "../types/navigation"; // Ensure path is correct
import type { Yacht } from "../types/yacht"; // Ensure path is correct
import YachtList from "../components/YachtList"; // Ensure path is correct
import {
  IconProps,
  PriceIcon,
  SeizedIcon,
  SizeIcon,
  SpeedometerIcon,
} from "../components/icons/CustomIcons"; // Ensure path is correct

// Props for the HomeScreen. It expects navigation props from React Navigation,
// AND 'yachts' and 'isLoading' from a parent component.
// Note: You used 'HomeRoot'. Ensure this matches the name in your Navigator.
type Props = NativeStackScreenProps<HomeStackParamList, "HomeRoot"> & {
  yachts: Yacht[];
  isLoading: boolean;
};

// A smaller component for the filter buttons at the top.
const FilterButton: React.FC<{
  isActive: boolean;
  onPress: () => void;
  icon: React.FC<IconProps>;
}> = ({ isActive, onPress, icon: Icon }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.filterButton}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon size={30} color={isActive ? "#000" : "#666"} />
      </Animated.View>
      {isActive && <View style={styles.underline} />}
    </TouchableOpacity>
  );
};

// --- Main HomeScreen Component ---
const HomeScreen: React.FC<Props> = ({ navigation, yachts, isLoading }) => {
  const [filters, setFilters] = useState({
    byLength: false,
    bySpeed: false,
    byPrice: false,
    bySeized: false,
  });

  const listRef = useRef<FlatList>(null);
  const searchButtonScale = useRef(new Animated.Value(1)).current;

  const scrollToTop = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const handleYachtPress = (yacht: Yacht) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Detail", { yacht });
  };

  const handleSearchPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Search", { yachts });
  };

  // Memoized function to parse numeric strings (e.g., "150m", "$200M")
  const parseNumericValue = useCallback((value: string | number): number => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return 0;
    const numericString = value.replace(/[^\d.]/g, "");
    const parsedValue = parseFloat(numericString);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }, []);

  // Memoized function to apply filters and sorting to the yacht list
  const getFilteredYachts = useCallback(() => {
    const currentYachts = Array.isArray(yachts) ? yachts : [];
    let filtered = [...currentYachts];

    if (filters.byLength) {
      filtered.sort(
        (a, b) => parseNumericValue(b.length) - parseNumericValue(a.length)
      );
    } else if (filters.bySpeed) {
      filtered.sort(
        (a, b) => parseNumericValue(b.topSpeed) - parseNumericValue(a.topSpeed)
      );
    } else if (filters.byPrice) {
      filtered.sort(
        (a, b) => parseNumericValue(b.price) - parseNumericValue(a.price)
      );
    }

    if (filters.bySeized) {
      filtered = filtered.filter(
        (yacht) => yacht.seizedBy && yacht.seizedBy.trim() !== ""
      );
    }

    return filtered;
  }, [yachts, filters, parseNumericValue]);

  // Toggles a filter on or off
  const toggleFilter = useCallback((filterName: keyof typeof filters) => {
    Haptics.selectionAsync();
    setFilters((prev) => {
      const isCurrentlyActive = prev[filterName];
      // Reset all *sorting* filters
      const newFilters = {
        ...prev,
        byLength: false,
        bySpeed: false,
        byPrice: false,
      };

      // If toggling a sort filter that wasn't active, activate it.
      // If it *was* active, it's now turned off by the reset above.
      if (filterName !== "bySeized" && !isCurrentlyActive) {
        newFilters[filterName] = true;
      }

      // Toggle the seized filter independently
      if (filterName === "bySeized") {
        newFilters.bySeized = !prev.bySeized;
      }

      return newFilters;
    });
    scrollToTop();
  }, []);

  return (
    <View style={styles.container}>
      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <FilterButton
          isActive={filters.byLength}
          onPress={() => toggleFilter("byLength")}
          icon={SizeIcon}
        />
        <FilterButton
          isActive={filters.bySpeed}
          onPress={() => toggleFilter("bySpeed")}
          icon={SpeedometerIcon}
        />
        <FilterButton
          isActive={filters.byPrice}
          onPress={() => toggleFilter("byPrice")}
          icon={PriceIcon}
        />
        <FilterButton
          isActive={filters.bySeized}
          onPress={() => toggleFilter("bySeized")}
          icon={SeizedIcon}
        />
      </View>

      {/* Yacht List */}
      <YachtList
        ref={listRef}
        yachts={getFilteredYachts()}
        onYachtPress={handleYachtPress}
        isLoading={isLoading}
      />

      {/* Floating Search Button */}
      <TouchableOpacity
        style={styles.searchButtonContainer}
        onPress={handleSearchPress}
        activeOpacity={0.8}
      >
        <Ionicons name="search" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  filterButton: {
    padding: 12,
    alignItems: "center",
    position: "relative",
  },
  underline: {
    position: "absolute",
    bottom: 5,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: "#000",
    borderRadius: 2,
  },
  searchButtonContainer: {
    position: "absolute",
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default HomeScreen;
