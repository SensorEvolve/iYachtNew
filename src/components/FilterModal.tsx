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
import FilterModal from "../components/FilterModal";
import { Yacht, YachtFilters } from "../Types/yacht";
import { Ionicons } from "@expo/vector-icons";

interface Props extends NativeStackScreenProps<RootStackParamList, "Home"> {
  yachts: Yacht[];
  isLoading: boolean;
}

const HomeScreen: React.FC<Props> = ({ navigation, yachts, isLoading }) => {
  // State for quick filters
  const [quickFilters, setQuickFilters] = useState({
    byLength: false,
    bySpeed: false,
    byPrice: false,
    bySeized: false,
  });

  // State for detailed filters modal
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [detailedFilters, setDetailedFilters] = useState<YachtFilters>({});

  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  // Helper function to safely convert string to number
  const parseNumericValue = (value: string): number => {
    const numericString = value.replace(/[^\d.]/g, "");
    const parsedValue = parseFloat(numericString);
    return isNaN(parsedValue) ? 0 : parsedValue;
  };

  const getFilteredYachts = () => {
    let filtered = [...yachts];

    // Apply quick filters first
    if (quickFilters.byLength) {
      filtered.sort((a, b) => {
        const lengthA = parseNumericValue(a.length);
        const lengthB = parseNumericValue(b.length);
        return lengthB - lengthA;
      });
    }

    if (quickFilters.bySpeed) {
      filtered.sort((a, b) => {
        const speedA = parseNumericValue(a.topSpeed);
        const speedB = parseNumericValue(b.topSpeed);
        return speedB - speedA;
      });
    }

    if (quickFilters.byPrice) {
      filtered.sort((a, b) => {
        const priceA = parseNumericValue(a.price);
        const priceB = parseNumericValue(b.price);
        return priceB - priceA;
      });
    }

    if (quickFilters.bySeized) {
      filtered = filtered.filter(
        (yacht) => yacht.seizedBy && yacht.seizedBy.trim() !== "",
      );
    }

    // Then apply detailed filters
    if (detailedFilters.lengthMin || detailedFilters.lengthMax) {
      filtered = filtered.filter((yacht) => {
        const length = parseNumericValue(yacht.length);
        const meetsMin =
          !detailedFilters.lengthMin || length >= detailedFilters.lengthMin;
        const meetsMax =
          !detailedFilters.lengthMax || length <= detailedFilters.lengthMax;
        return meetsMin && meetsMax;
      });
    }

    if (detailedFilters.yearMin || detailedFilters.yearMax) {
      filtered = filtered.filter((yacht) => {
        const year = parseNumericValue(yacht.delivered);
        const meetsMin =
          !detailedFilters.yearMin || year >= detailedFilters.yearMin;
        const meetsMax =
          !detailedFilters.yearMax || year <= detailedFilters.yearMax;
        return meetsMin && meetsMax;
      });
    }

    if (detailedFilters.builder) {
      filtered = filtered.filter((yacht) =>
        yacht.builtBy
          .toLowerCase()
          .includes(detailedFilters.builder!.toLowerCase()),
      );
    }

    if (detailedFilters.yachtType) {
      filtered = filtered.filter((yacht) =>
        yacht.yachtType
          .toLowerCase()
          .includes(detailedFilters.yachtType!.toLowerCase()),
      );
    }

    return filtered;
  };

  // Quick filter toggle handlers
  const toggleLengthFilter = () => {
    setQuickFilters((prev) => ({
      byLength: !prev.byLength,
      bySpeed: false,
      byPrice: false,
      bySeized: false,
    }));
  };

  const toggleSpeedFilter = () => {
    setQuickFilters((prev) => ({
      byLength: false,
      bySpeed: !prev.bySpeed,
      byPrice: false,
      bySeized: false,
    }));
  };

  const togglePriceFilter = () => {
    setQuickFilters((prev) => ({
      byLength: false,
      bySpeed: false,
      byPrice: !prev.byPrice,
      bySeized: false,
    }));
  };

  const toggleSeizedFilter = () => {
    setQuickFilters((prev) => ({
      byLength: false,
      bySpeed: false,
      byPrice: false,
      bySeized: !prev.bySeized,
    }));
  };

  // Filter modal handlers
  const handleApplyFilters = (filters: YachtFilters) => {
    setDetailedFilters(filters);
    setFilterModalVisible(false);
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
                quickFilters.byLength && styles.activeFilter,
              ]}
            >
              <Ionicons
                name="resize"
                size={24}
                color={quickFilters.byLength ? "#000" : "#666"}
              />
              {quickFilters.byLength && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSpeedFilter}
              style={[
                styles.filterButton,
                quickFilters.bySpeed && styles.activeFilter,
              ]}
            >
              <Ionicons
                name="speedometer"
                size={24}
                color={quickFilters.bySpeed ? "#000" : "#666"}
              />
              {quickFilters.bySpeed && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePriceFilter}
              style={[
                styles.filterButton,
                quickFilters.byPrice && styles.activeFilter,
              ]}
            >
              <Ionicons
                name="cash"
                size={24}
                color={quickFilters.byPrice ? "#000" : "#666"}
              />
              {quickFilters.byPrice && <View style={styles.underline} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleSeizedFilter}
              style={[
                styles.filterButton,
                quickFilters.bySeized && styles.activeFilter,
              ]}
            >
              <Ionicons
                name="warning"
                size={24}
                color={quickFilters.bySeized ? "#000" : "#666"}
              />
              {quickFilters.bySeized && <View style={styles.underline} />}
            </TouchableOpacity>
          </View>
          <YachtList
            yachts={getFilteredYachts()}
            onYachtPress={handleYachtPress}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
          //Note ERROR, check with AI.
          <FilterModal
            visible={filterModalVisible}
            onClose={() => setFilterModalVisible(false)}
            onApply={handleApplyFilters}
            filters={detailedFilters}
          />
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: 10,
  },
  filterButton: {
    padding: 10,
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
