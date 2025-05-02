import React, {
  // Removed useState as isLoading state is removed from YachtItem
  useCallback,
  memo,
  forwardRef,
  useEffect, // Keep useEffect for SkeletonItem
} from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator, // Keep for potential future use, though not used in YachtItem now
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Yacht } from "../Types/yacht";
import { getMainImage } from "../utils/imageUtils";

interface YachtListProps {
  yachts: Yacht[];
  onYachtPress: (yacht: Yacht) => void;
  isLoading?: boolean; // Prop for overall list loading (Skeleton)
}

interface YachtItemProps {
  yacht: Yacht;
  onPress: () => void;
  // Removed onLoadStart/onLoadEnd from props as they are not used in simplified version
  // onLoadStart: () => void;
  // onLoadEnd: () => void;
}

// --- SkeletonItem and SkeletonList components remain unchanged ---
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
// --- End of Skeleton components ---

// *** YachtItem Modified for Test 1: Removed internal loading state ***
const YachtItem = memo(
  ({ yacht, onPress /* Removed onLoadStart, onLoadEnd from props */ }: YachtItemProps) => {
    // const [isLoading, setIsLoading] = useState(true); // <-- REMOVED
    const imageSource = getMainImage(yacht.imageName);

    // Keep console log for local testing if desired
    console.log(
      `(Local Log) YachtItem Render: ${yacht.name}, ImageName: ${yacht.imageName}, Source: ${imageSource}`,
    );

    // const handleLoadStart = useCallback(() => { ... }, []); // <-- REMOVED
    // const handleLoadEnd = useCallback(() => { ... }, []); // <-- REMOVED
    // const handleLoadError = useCallback(() => { ... }, []); // <-- REMOVED (can add basic error logging if needed)

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
          <View style={styles.cardContent}>
            <View style={styles.imageSection}>
              {/* {isLoading && ( ... <ActivityIndicator ... /> ... )} */
              /* <-- REMOVED */}
              <Image
                source={imageSource}
                // style={[styles.yachtImage, isLoading && styles.imageHidden]} // <-- Use base style ONLY
                style={styles.yachtImage}
                resizeMode="cover"
                // onLoadStart={handleLoadStart} // <-- REMOVED
                // onLoadEnd={handleLoadEnd}     // <-- REMOVED
                // onError={handleLoadError}   // <-- REMOVED (or add simple console.error)
                onError={(error) => {
                  // Optional basic error logging
                  console.error(
                    `IMAGE LOAD ERROR for ${yacht.name} (Source: ${imageSource}):`,
                    error.nativeEvent.error,
                  );
                }}
              />
              {yacht.seizedBy && (
                <View style={styles.seizedBadge}>
                  <Ionicons name="warning" size={16} color="#fff" />
                </View>
              )}
            </View>

            {/* --- Info Section remains unchanged --- */}
            <View style={styles.infoSection}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {yacht.name}
                </Text>
                <Text style={styles.builder} numberOfLines={1}>
                  {yacht.builtBy}
                </Text>
                <Text style={styles.year}>{yacht.delivered}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.details}>{yacht.length}m</Text>
                <Text style={styles.separator}>|</Text>
                <Text style={styles.details}>{yacht.topSpeed} knots</Text>
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
            {/* --- End of Info Section --- */}
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

// --- YachtList component remains mostly unchanged ---
// It no longer needs to pass down onLoadStart/End unless the parent uses them
const YachtList = forwardRef<FlatList, YachtListProps>(
  ({ yachts, onYachtPress, isLoading }, ref) => {
    // Removed the loadingImages state and handlers as they are not used by simplified YachtItem
    // const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
    // const handleLoadStart = useCallback((id: string) => { ... }, []);
    // const handleLoadEnd = useCallback((id: string) => { ... }, []);

    const renderYacht = useCallback(
      ({ item }: { item: Yacht }) => (
        <YachtItem
          yacht={item}
          onPress={() => onYachtPress(item)}
          // No longer passing onLoadStart/onLoadEnd down
        />
      ),
      [onYachtPress], // Dependencies updated
    );

    const keyExtractor = useCallback((item: Yacht) => item.id, []);

    if (isLoading) {
      // This isLoading is for the whole list (passed from HomeScreen)
      return <SkeletonList />;
    }

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
// --- End of YachtList component ---

// --- Styles remain unchanged ---
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
    backgroundColor: "#F8F9FA", // Background shown briefly before image loads
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  seizedBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  // loadingContainer: { // Style is still here but component using it is commented out
  //   position: "absolute",
  //   top: 0,
  //   left: 0,
  //   right: 0,
  //   bottom: 0,
  //   justifyContent: "center",
  //   alignItems: "center",
  //   backgroundColor: "rgba(248, 249, 250, 0.9)",
  //   zIndex: 1,
  // },
  yachtImage: {
    width: "100%",
    height: "100%",
  },
  // imageHidden: { // Style is still here but style prop using it is commented out
  //  opacity: 0,
  // },
  infoSection: {
    padding: 12,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1A1A1A",
    marginRight: 8,
    letterSpacing: 0.5,
  },
  builder: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  year: {
    fontSize: 14,
    color: "#666",
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
// --- End of Styles ---

YachtList.displayName = "YachtList";

export default memo(YachtList);
