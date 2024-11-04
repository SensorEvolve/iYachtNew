import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  PanResponder,
  Animated,
  GestureResponderEvent,
  PanResponderGestureState,
  ViewStyle,
  StyleProp,
  Image,
} from "react-native";
import { Yacht } from "../Types/yacht";
import { getDetailImages } from "../utils/imageUtils";
import { toggleFavorite } from "../utils/db";
import { Ionicons } from "@expo/vector-icons";

interface YachtDetailProps {
  yacht: Yacht;
}

interface ImageSlideStyle extends ViewStyle {
  width: number;
}

const YachtDetail: React.FC<YachtDetailProps> = ({ yacht }) => {
  const windowWidth = Dimensions.get("window").width;
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(yacht.isFavorite || false);
  const flatListRef = useRef<FlatList>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const isZoomed = useRef<{ current: boolean }>({ current: false });
  const [enabled, setEnabled] = useState(true);
  const lastTap = useRef<number>(0);

  // Load images
  useEffect(() => {
    const loadImages = async () => {
      try {
        setLoading(true);
        const loadedImages = await getDetailImages(Number(yacht.id));
        setImages(loadedImages);
      } catch (error) {
        console.error("Error loading images:", error);
      } finally {
        setLoading(false);
      }
    };
    loadImages();
  }, [yacht.id]);

  const handleFavoritePress = async () => {
    try {
      await toggleFavorite(Number(yacht.id));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
      const toValue = isZoomed.current.current ? 1 : 2;
      Animated.spring(scale, {
        toValue,
        useNativeDriver: true,
      }).start();
      isZoomed.current.current = !isZoomed.current.current;
      setEnabled(!isZoomed.current.current);
    }
    lastTap.current = now;
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      handleDoubleTap();
    },
    onPanResponderMove: (
      evt: GestureResponderEvent,
      _: PanResponderGestureState,
    ) => {
      const touches = evt.nativeEvent.changedTouches;
      if (touches && touches.length === 2) {
        const touchA = touches[0];
        const touchB = touches[1];

        const distance = Math.sqrt(
          Math.pow(touchA.pageX - touchB.pageX, 2) +
            Math.pow(touchA.pageY - touchB.pageY, 2),
        );

        const newScale = Math.max(1, Math.min(distance / 200, 3));
        scale.setValue(newScale);
        setEnabled(newScale <= 1);
      }
    },
    onPanResponderRelease: () => {
      const currentScale = (scale as any)._value;
      if (currentScale < 1) {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        setEnabled(true);
      } else if (currentScale > 3) {
        Animated.spring(scale, {
          toValue: 3,
          useNativeDriver: true,
        }).start();
        setEnabled(false);
      }
    },
  });

  const renderInfoRow = (label: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    );
  };

  const renderImage = ({ item, index }: { item: string; index: number }) => {
    const imageSlideStyle: StyleProp<ImageSlideStyle> = {
      ...styles.imageSlide,
      width: windowWidth,
    };

    return (
      <View style={imageSlideStyle} {...panResponder.panHandlers}>
        {loading && (
          <ActivityIndicator
            style={styles.loadingIndicator}
            size="large"
            color="#999"
          />
        )}
        <Animated.Image
          source={{ uri: item }}
          style={[
            styles.heroImage,
            {
              width: windowWidth,
              transform: [{ scale }],
            },
          ]}
          resizeMode="contain"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
      </View>
    );
  };

  const handleScroll = (event: any) => {
    if (enabled) {
      const contentOffset = event.nativeEvent.contentOffset;
      const index = Math.round(contentOffset.x / windowWidth);
      setActiveIndex(index);
    }
  };

  const goToImage = (index: number) => {
    if (enabled) {
      flatListRef.current?.scrollToOffset({
        offset: index * windowWidth,
        animated: true,
      });
    }
  };

  return (
    <ScrollView style={styles.container} scrollEnabled={false}>
      {/* Image Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={images}
          renderItem={renderImage}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          scrollEnabled={enabled}
        />

        {/* Page Indicators */}
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

      {/* Content ScrollView */}
      <ScrollView style={styles.contentScroll}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.titleRow}>
              <Text style={styles.yachtName}>{yacht.name}</Text>
              <TouchableOpacity
                onPress={handleFavoritePress}
                style={styles.favoriteButton}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={28}
                  color={isFavorite ? "#FF4444" : "#666666"}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.mainSpecs}>
              {yacht.length}m • Built {yacht.delivered}
            </Text>
            <Text style={styles.builder}>Built by {yacht.builtBy}</Text>
          </View>

          {/* Rest of the sections remain the same */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{yacht.shortInfo}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Specifications</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Length</Text>
                <Text style={styles.statValue}>{yacht.length}m</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Beam</Text>
                <Text style={styles.statValue}>{yacht.beam}m</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Guests</Text>
                <Text style={styles.statValue}>{yacht.guests}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Crew</Text>
                <Text style={styles.statValue}>{yacht.crew}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            {renderInfoRow("Top Speed", `${yacht.topSpeed} knots`)}
            {renderInfoRow("Cruise Speed", `${yacht.cruiseSpeed} knots`)}
            {renderInfoRow("Range", `${yacht.range} nm`)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Design</Text>
            {renderInfoRow("Yacht Type", yacht.yachtType)}
            {renderInfoRow("Exterior Designer", yacht.exteriorDesigner)}
            {renderInfoRow("Interior Designer", yacht.interiorDesigner)}
            {renderInfoRow("Flag", yacht.flag)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ownership</Text>
            {renderInfoRow("Owner", yacht.owner)}
            {renderInfoRow("Price", yacht.price)}
            {yacht.seizedBy && (
              <View style={styles.seizedContainer}>
                <Text style={styles.seizedText}>
                  🚫 Seized by {yacht.seizedBy}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // ... All existing styles remain the same ...
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  favoriteButton: {
    padding: 8,
  },
  // ... Rest of your existing styles ...
});

export default YachtDetail;
