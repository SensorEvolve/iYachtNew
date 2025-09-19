import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  // Removed Button import as we use TouchableOpacity
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// *** UPDATED TYPE IMPORT ***
// Make sure the path and filename ('NavigationParams.ts') are correct
// Use the correct ParamList for the Stack this screen belongs to
import type { HomeStackParamList } from "../types/navigation";
// *** END UPDATE ***
import { getDetailImages, getMainImage } from "../utils/imageUtils"; // Adjust path if needed
import { FavoritesButton } from "../components/FavoritesButton"; // Adjust path if needed
// Import Alert if you want to use it in handleShowOnMap for missing MMSI
// import { Alert } from 'react-native';

// *** UPDATED TYPE USAGE ***
type Props = NativeStackScreenProps<HomeStackParamList, "Detail">;
// *** END UPDATE ***

const DetailScreen: React.FC<Props> = ({ route, navigation }) => {
  // --- Get yacht data from route ---
  const { yacht } = route.params;

  // --- Early return if yacht data is missing ---
  if (!yacht) {
    // Or render a more informative loading/error state
    return (
      <View style={styles.container}>
        <Text>Yacht data not available.</Text>
      </View>
    );
  }
  // --- End Check ---

  // --- Component State and Refs ---
  const windowWidth = Dimensions.get("window").width;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<number>>(null);

  // --- Image Handling ---
  const mainImage = getMainImage(yacht.imageName);
  const detailImages = getDetailImages(yacht.imageName);
  const images = detailImages.length > 0 ? detailImages : [mainImage]; // Use detail images if available, else main

  // --- Image Carousel Functions ---
  const renderImage = ({ item }: { item: number }) => {
    // Note: The 'item' unused warning might be incorrect from your linter tooling
    // as 'item' is used below in source={item}. If it persists, you can ignore it
    // or try renaming: renderImage = ({ item: imageSource }: { item: number }) => ... source={imageSource}
    return (
      <View style={[styles.imageSlide, { width: windowWidth }]}>
        <Image
          source={item} // item is the image source from the images array
          style={[styles.heroImage, { width: windowWidth }]}
          resizeMode="contain"
        />
      </View>
    );
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  const goToImage = (index: number) => {
    flatListRef.current?.scrollToOffset?.({
      offset: index * windowWidth,
      animated: true,
    });
  };

  // --- Map Navigation Handler ---
  const handleShowOnMap = () => {
    if (yacht?.mmsi) {
      // Navigate to the 'MapTab' (the name of the tab screen in AppTabs.tsx)
      navigation.navigate("MapTab", { focusedMmsi: yacht.mmsi });
    } else {
      console.warn("[DetailScreen] Cannot show on map: Yacht MMSI is missing.");
      // Optionally show an alert to the user
      // Alert.alert("Missing Information", "Cannot show on map as the yacht's MMSI is missing.");
    }
  };

  // --- Check for MMSI for Button State ---
  const hasMmsi = !!yacht?.mmsi;

  // --- Render Component ---
  // REMEMBER TO CHECK ALL JSX BELOW FOR STRAY TEXT OUTSIDE <Text> TAGS
  return (
    <ScrollView style={styles.container}>
      {/* Image Carousel Section */}
      <View style={styles.carouselContainer}>
        {/* Image FlatList */}
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          keyExtractor={(item, index) => `image_${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />

        {/* Pagination Dots (only if multiple images) */}
        {images.length > 1 && (
          <View style={styles.pagination}>
            {/* Map function with explicit types to address 'implicit any' warning */}
            {images.map((_: number, index: number) => (
              <TouchableOpacity
                key={`dot_${index}`}
                onPress={() => goToImage(index)}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Live Track Overlay Button */}
        <TouchableOpacity
          style={[
            styles.liveTrackButton,
            !hasMmsi && styles.liveTrackButtonDisabled,
          ]}
          onPress={handleShowOnMap}
          disabled={!hasMmsi}
          activeOpacity={hasMmsi ? 0.7 : 1.0}
        >
          <Text style={styles.liveTrackButtonText}>LIVE TRACK</Text>
        </TouchableOpacity>
      </View>

      {/* Header Section Below Image */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.yachtName} numberOfLines={1} ellipsizeMode="tail">
            {yacht.name}
          </Text>
          <FavoritesButton yachtId={yacht.id} />
        </View>
        <View style={styles.headerDetails}>
          <Text style={styles.headerText}>Built by {yacht.builtBy}</Text>
          <Text style={styles.headerText}>{yacht.length}m</Text>
        </View>
      </View>

      {/* Performance Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Top Speed</Text>
          <Text style={styles.value}>{yacht.topSpeed} knots</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Cruise Speed</Text>
          <Text style={styles.value}>{yacht.cruiseSpeed} knots</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Range</Text>
          <Text style={styles.value}>{yacht.range} nm</Text>
        </View>
      </View>

      {/* Capacity Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Capacity</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Guests</Text>
          <Text style={styles.value}>{yacht.guests}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Crew</Text>
          <Text style={styles.value}>{yacht.crew}</Text>
        </View>
      </View>

      {/* Technical Details Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>MMSI</Text>
          <Text style={styles.value}>{yacht.mmsi || "N/A"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Type</Text>
          <Text style={styles.value}>{yacht.yachtType}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Beam</Text>
          <Text style={styles.value}>{yacht.beam}m</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Delivered</Text>
          <Text style={styles.value}>{yacht.delivered}</Text>
        </View>
        {yacht.refit && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Last Refit</Text>
            <Text style={styles.value}>{yacht.refit}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.label}>Flag</Text>
          <Text style={styles.value}>{yacht.flag}</Text>
        </View>
      </View>

      {/* Design Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Exterior Designer</Text>
          <Text style={styles.value}>{yacht.exteriorDesigner}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Interior Designer</Text>
          <Text style={styles.value}>{yacht.interiorDesigner}</Text>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{yacht.shortInfo}</Text>
      </View>

      {/* Ownership Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ownership</Text>
        <View style={[styles.detailRow, styles.ownerRow]}>
          <Text style={styles.label}>Owner</Text>
          <Text
            style={[styles.value, styles.ownerValue]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {yacht.owner}
          </Text>
        </View>{" "}
        {/* Syntax typo previously fixed here */}
        {yacht.price && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{yacht.price}</Text>
          </View>
        )}
        {yacht.seizedBy && (
          <View style={styles.seizedContainer}>
            <Text style={styles.seizedText}>🚫 Seized by {yacht.seizedBy}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF", // White background for the scroll view
  },
  carouselContainer: {
    position: "relative",
    backgroundColor: "#f0f0f0",
    height: 300,
  },
  imageSlide: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    height: "100%",
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    zIndex: 1,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  liveTrackButton: {
    position: "absolute",
    bottom: 15,
    right: 15,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  liveTrackButtonDisabled: {
    backgroundColor: "rgba(100, 100, 100, 0.5)",
  },
  liveTrackButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  headerSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  yachtName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111",
    flex: 1,
    marginRight: 8,
  },
  headerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  headerText: {
    fontSize: 15,
    color: "#555",
  },
  section: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 0,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  ownerRow: {
    alignItems: "flex-start",
  },
  label: {
    fontSize: 15,
    color: "#666",
    flex: 0.4,
    marginRight: 8,
  },
  value: {
    fontSize: 15,
    color: "#111",
    fontWeight: "500",
    flex: 0.6,
    textAlign: "right",
  },
  ownerValue: {
    textAlign: "right",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  seizedContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FFF3F3",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#E53E3E",
  },
  seizedText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#C53030",
  },
});

export default DetailScreen;
