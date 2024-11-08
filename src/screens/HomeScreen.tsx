import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  Animated,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation";
import * as Haptics from "expo-haptics";
import YachtList from "../components/YachtList";
import { Yacht } from "../Types/yacht";
import { Ionicons } from "@expo/vector-icons";
import {
  SizeIcon,
  SpeedometerIcon,
  PriceIcon,
  SeizedIcon,
  IconProps,
} from "../components/icons/CustomIcons";

interface Props extends NativeStackScreenProps<RootStackParamList, "Home"> {
  yachts: Yacht[];
  isLoading: boolean;
}

interface FilterButtonProps {
  isActive: boolean;
  onPress: () => void;
  icon: React.FC<IconProps>;
}

const FilterButton: React.FC<FilterButtonProps> = ({
  isActive,
  onPress,
  icon: Icon,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.filterButton, isActive && styles.activeFilter]}
      activeOpacity={0.7}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Icon size={30} color={isActive ? "#000" : "#666"} />
      </Animated.View>
      {isActive && <View style={styles.underline} />}
    </TouchableOpacity>
  );
};

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

  const handleFilterPress = async (filterFunction: () => void) => {
    await Haptics.selectionAsync();
    filterFunction();
  };

  const handleYachtPress = async (yacht: Yacht) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Detail", { yacht });
  };

  const handleFavoritesPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Favorites", { yachts });
  };

  const handleSearchPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("Search", { yachts });
  };

  const handleSearchPressIn = () => {
    Animated.spring(searchButtonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchPressOut = () => {
    Animated.spring(searchButtonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const parseNumericValue = useCallback((value: string): number => {
    const numericString = value.replace(/[^\d.]/g, "");
    const parsedValue = parseFloat(numericString);
    return isNaN(parsedValue) ? 0 : parsedValue;
  }, []);

  const getFilteredYachts = useCallback(() => {
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

    return filtered;
  }, [yachts, filters, parseNumericValue]);

  const toggleFilter = useCallback((filterName: keyof typeof filters) => {
    handleFilterPress(() => {
      setFilters((prev) => {
        const newFilters = {
          byLength: false,
          bySpeed: false,
          byPrice: false,
          bySeized: false,
        };
        newFilters[filterName] = !prev[filterName];
        return newFilters;
      });
      scrollToTop();
    });
  }, []);

  return (
    <View style={styles.container}>
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
        <TouchableOpacity
          style={styles.filterButton}
          onPress={handleFavoritesPress}
          activeOpacity={0.7}
        >
          <Ionicons name="heart-outline" size={30} color="#666" />
        </TouchableOpacity>
      </View>

      <YachtList
        ref={listRef}
        yachts={getFilteredYachts()}
        onYachtPress={handleYachtPress}
        isLoading={isLoading}
      />

      <Animated.View
        style={[
          styles.searchButtonContainer,
          { transform: [{ scale: searchButtonScale }] },
        ]}
      >
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchPress}
          onPressIn={handleSearchPressIn}
          onPressOut={handleSearchPressOut}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={30} color="white" />
        </TouchableOpacity>
      </Animated.View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: 2,
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  filterButton: {
    padding: 12,
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
  searchButtonContainer: {
    position: "absolute",
    right: 20,
    bottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  searchButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
