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
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../Types/navigation"; // Changed import path
import { getMainImage, getDetailImages } from "../utils/imageUtils";
import { FavoritesButton } from "../components/FavoritesButton";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

const DetailScreen: React.FC<Props> = ({ route }) => {
  const { yacht } = route.params;
  const windowWidth = Dimensions.get("window").width;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<number>>(null);
  const mainImage = getMainImage(yacht.imageName);
  const detailImages = getDetailImages(yacht.imageName);
  const images = detailImages.length > 0 ? detailImages : [mainImage];

  const renderImage = ({ item }: { item: number }) => {
    return (
      <View style={[styles.imageSlide, { width: windowWidth }]}>
        <Image
          source={item}
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
  return (
    <ScrollView style={styles.container}>
      {/* Image Section */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
        {images.length > 1 && (
          <View style={styles.pagination}>
            {images.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToImage(index)}
                style={[
                  styles.paginationDot,
                  index === activeIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Header Section */}
      <View style={styles.headerSection}>
        <View style={styles.titleRow}>
          <Text style={styles.yachtName}>{yacht.name}</Text>
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
        <View style={[styles.detailRow, styles.ownerRow]}>
          <Text style={styles.label}>Owner</Text>
          <Text style={[styles.value, styles.ownerValue]} numberOfLines={2}>
            {yacht.owner}
          </Text>
        </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  carouselContainer: {
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageSlide: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },
  heroImage: {
    height: 300,
  },
  pagination: {
    flexDirection: "row",
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FFFFFF",
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerSection: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  yachtName: {
    fontSize: 28,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
  headerDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerText: {
    fontSize: 16,
    color: "#666666",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ownerRow: {
    alignItems: "flex-start",
    minHeight: 40,
  },
  label: {
    fontSize: 16,
    color: "#666666",
    flex: 0.3,
  },
  value: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  ownerValue: {
    flex: 0.7,
    textAlign: "right",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  seizedContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF4444",
  },
  seizedText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF4444",
  },
});

export default DetailScreen;
