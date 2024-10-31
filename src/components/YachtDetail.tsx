import React, { useState, useRef } from "react";
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
} from "react-native";
import { Yacht } from "../Types/yacht";
import { getDetailImages } from "../utils/imageUtils";

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
  const flatListRef = useRef<FlatList>(null);
  const images = getDetailImages(yacht.imageName);
  const scale = useRef(new Animated.Value(1)).current;
  const isZoomed = useRef<{ current: boolean }>({ current: false });
  const [enabled, setEnabled] = useState(true);
  const lastTap = useRef<number>(0);

  //New code HAND GESTURES, if you decide
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

  const renderImage = ({ item, index }: { item: number; index: number }) => {
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
          source={item}
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
            <Text style={styles.yachtName}>{yacht.name}</Text>
            <Text style={styles.mainSpecs}>
              {yacht.length}m • Built {yacht.delivered}
            </Text>
            <Text style={styles.builder}>Built by {yacht.builtBy}</Text>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{yacht.shortInfo}</Text>
          </View>

          {/* Key Specifications */}
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

          {/* Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            {renderInfoRow("Top Speed", `${yacht.topSpeed} knots`)}
            {renderInfoRow("Cruise Speed", `${yacht.cruiseSpeed} knots`)}
            {renderInfoRow("Range", `${yacht.range} nm`)}
          </View>

          {/* Design */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Design</Text>
            {renderInfoRow("Yacht Type", yacht.yachtType)}
            {renderInfoRow("Exterior Designer", yacht.exteriorDesigner)}
            {renderInfoRow("Interior Designer", yacht.interiorDesigner)}
            {renderInfoRow("Flag", yacht.flag)}
          </View>

          {/* Ownership */}
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
    overflow: "hidden",
  },
  heroImage: {
    height: 300,
  },
  loadingIndicator: {
    position: "absolute",
    zIndex: 1,
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
  contentScroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  yachtName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  mainSpecs: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 4,
  },
  builder: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -8,
  },
  statItem: {
    width: "50%",
    padding: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
    flex: 1,
    textAlign: "right",
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

export default YachtDetail;
