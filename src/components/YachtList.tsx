import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import type { Yacht } from "../Types/yacht";
import { getMainImage } from "../utils/imageUtils";

interface YachtListProps {
  yachts: Yacht[];
  onYachtPress: (yacht: Yacht) => void;
}

const YachtItem = memo(
  ({
    yacht,
    onPress,
    onLoadStart,
    onLoadEnd,
  }: {
    yacht: Yacht;
    onPress: () => void;
    onLoadStart: () => void;
    onLoadEnd: () => void;
  }) => {
    const imageSource = getMainImage(yacht.imageName);

    return (
      <TouchableOpacity style={styles.yachtContainer} onPress={onPress}>
        <View style={styles.imageContainer}>
          <Image
            source={imageSource}
            style={styles.yachtImage}
            resizeMode="contain"
            onLoadStart={onLoadStart}
            onLoadEnd={onLoadEnd}
          />
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{yacht.name}</Text>
          <Text style={styles.details}>
            {yacht.length}m • Built {yacht.delivered}
          </Text>
          <Text style={styles.builder}>{yacht.builtBy}</Text>
        </View>
      </TouchableOpacity>
    );
  },
);

const YachtList: React.FC<YachtListProps> = ({ yachts, onYachtPress }) => {
  const [loadingImages, setLoadingImages] = useState<{
    [key: string]: boolean;
  }>({});

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
      data={yachts}
      renderItem={renderYacht}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContainer}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={5}
      initialNumToRender={6}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 10,
  },
  yachtContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  yachtImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  details: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  builder: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
});

export default memo(YachtList);
