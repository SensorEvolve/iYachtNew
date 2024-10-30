import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

// Static image mapping
const yachtImageMap = {
  rev_ocean: {
    main: require("../assets/yachts/rev_ocean.png"),
    gallery: [
      require("../assets/yachts/rev_ocean_1.png"),
      require("../assets/yachts/rev_ocean_2.png"),
      require("../assets/yachts/rev_ocean_3.png"),
    ],
  },
  azzam: {
    main: require("../assets/yachts/azzam.png"),
    gallery: [],
  },
  Fulk_Al_Salamah: {
    main: require("../assets/yachts/Fulk_Al_Salamah.png"),
    gallery: [],
  },
};

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

const DetailScreen: React.FC<Props> = ({ route }) => {
  const { yacht } = route.params;
  const windowWidth = Dimensions.get("window").width;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Get yacht images or default
  const yachtImages = yachtImageMap[
    yacht.imageName as keyof typeof yachtImageMap
  ] || {
    main: require("../assets/yachts/azzam.png"), // fallback image
    gallery: [],
  };

  // Combine main image with gallery images
  const allImages = [yachtImages.main, ...yachtImages.gallery];

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationDots}>
        {allImages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? "#000" : "#ccc" },
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery Section */}
      <View>
        <FlatList
          ref={flatListRef}
          data={allImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          renderItem={({ item }) => (
            <Image
              source={item}
              style={[
                styles.image,
                { width: windowWidth, height: windowWidth * 0.75 },
              ]}
              resizeMode="cover"
            />
          )}
          keyExtractor={(_, index) => index.toString()}
        />
        {allImages.length > 1 && renderPaginationDots()}
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.yachtName}>{yacht.name}</Text>
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

      {/* Technical Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Details</Text>
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
        <View style={styles.detailRow}>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.value}>{yacht.owner}</Text>
        </View>
        {yacht.price && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{yacht.price}</Text>
          </View>
        )}
        {yacht.seizedBy && (
          <View style={styles.detailRow}>
            <Text style={[styles.label, styles.seizedLabel]}>Status</Text>
            <Text style={[styles.value, styles.seizedValue]}>
              Seized by {yacht.seizedBy}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  image: {
    backgroundColor: "#f5f5f5",
  },
  paginationDots: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  headerSection: {
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  yachtName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  headerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  headerText: {
    fontSize: 18,
    color: "#666666",
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
    color: "#000000",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
  },
  label: {
    fontSize: 16,
    color: "#666666",
    flex: 1,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    flex: 2,
    textAlign: "right",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  seizedLabel: {
    color: "#666666",
  },
  seizedValue: {
    color: "#666666",
    fontStyle: "italic",
  },
});

export default DetailScreen;
