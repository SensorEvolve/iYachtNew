import React, {
  useState,
  useCallback,
  memo,
  forwardRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import type { Yacht } from "../Types/yacht";
import { getMainImage } from "../utils/imageUtils";

interface YachtListProps {
  yachts: Yacht[];
  onYachtPress: (yacht: Yacht) => void;
  isLoading?: boolean;
}

interface YachtItemProps {
  yacht: Yacht;
  onPress: () => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
}

// Skeleton Component
const SkeletonItem = () => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Animated.View style={[styles.skeletonImage, { opacity }]} />
          <View style={styles.infoSection}>
            <Animated.View style={[styles.skeletonTitle, { opacity }]} />
            <Animated.View style={[styles.skeletonDetails, { opacity }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const SkeletonList = () => {
  return (
    <FlatList
      data={[1, 2, 3, 4]}
      renderItem={() => <SkeletonItem />}
      keyExtractor={(item) => item.toString()}
      contentContainerStyle={styles.listContainer}
    />
  );
};

const YachtItem = memo(
  ({ yacht, onPress, onLoadStart, onLoadEnd }: YachtItemProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const imageSource = getMainImage(yacht.imageName);

    const handlePress = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    };

    const handleLongPress = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      onLoadStart();
    };

    const handleLoadEnd = () => {
      setIsLoading(false);
      onLoadEnd();
    };

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity
          style={styles.card}
          onPress={handlePress}
          onLongPress={handleLongPress}
          delayLongPress={500}
          activeOpacity={0.95}
        >
          <View style={styles.cardContent}>
            <View style={styles.imageSection}>
              {isLoading && (
                <View style={styles.loadingContainer}>
                  <Animated.View
                    style={[styles.skeletonImage, { opacity: 0.5 }]}
                  />
                </View>
              )}
              <Image
                source={imageSource}
                style={[styles.yachtImage, isLoading && styles.imageHidden]}
                resizeMode="cover"
                onLoadStart={handleLoadStart}
                onLoadEnd={handleLoadEnd}
              />
              {yacht.seizedBy && (
                <View style={styles.seizedBadge}>
                  <Ionicons name="warning" size={16} color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.name} numberOfLines={1}>
                {yacht.name}
              </Text>
              <View style={styles.detailsRow}>
                <Text style={styles.details}>{yacht.builtBy}</Text>
                <Text style={styles.separator}>|</Text>
                <Text style={styles.details}>{yacht.delivered}</Text>
                <Text style={styles.separator}>|</Text>
                <Text style={styles.details}>{yacht.length}m</Text>
                <Text style={styles.separator}>|</Text>
                <Text style={styles.details}>{yacht.price || "N/A"}</Text>
                {yacht.seizedBy && (
                  <>
                    <Text style={styles.separator}>|</Text>
                    <View style={styles.seizedIndicator}>
                      <Ionicons name="warning" size={14} color="#FF3B30" />
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

const YachtList = forwardRef<FlatList, YachtListProps>(
  ({ yachts, onYachtPress, isLoading = false }, ref) => {
    const [loadingImages, setLoadingImages] = useState<{
      [key: string]: boolean;
    }>({});

    if (isLoading) {
      return <SkeletonList />;
    }

    const renderYacht = useCallback(
      ({ item }: { item: Yacht }) => {
        const handleLoadStart = () =>
          setLoadingImages((prev) => ({ ...prev, [item.id]: true }));

        const handleLoadEnd = () =>
          setLoadingImages((prev) => ({ ...prev, [item.id]: false }));

        return (
          <YachtItem
            yacht={item}
            onPress={() => onYachtPress(item)}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
          />
        );
      },
      [onYachtPress],
    );

    const keyExtractor = useCallback((item: Yacht) => item.id, []);

    return (
      <FlatList
        ref={ref}
        data={yachts}
        renderItem={renderYacht}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        removeClippedSubviews={Platform.OS === "android"}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={4}
      />
    );
  },
);

const styles = StyleSheet.create({
  listContainer: {
    padding: 12,
    paddingBottom: 100,
    backgroundColor: "#FAFAFA",
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "#FFF",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E9F2",
  },
  cardContent: {
    backgroundColor: "#FFF",
  },
  imageSection: {
    width: "100%",
    height: 200,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  seizedBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(248, 249, 250, 0.9)",
    zIndex: 1,
  },
  yachtImage: {
    width: "100%",
    height: "100%",
  },
  imageHidden: {
    opacity: 0,
  },
  infoSection: {
    padding: 12,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  details: {
    fontSize: 14,
    color: "#505565",
    letterSpacing: 0.2,
  },
  separator: {
    fontSize: 14,
    color: "#505565",
    marginHorizontal: 6,
    opacity: 0.5,
  },
  seizedIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  // Skeleton styles
  skeletonImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#E1E9EE",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  skeletonTitle: {
    width: "70%",
    height: 24,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDetails: {
    width: "90%",
    height: 16,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
});

YachtList.displayName = "YachtList";

export default memo(YachtList);
