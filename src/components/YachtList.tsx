import React from "react";
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

const YachtList: React.FC<YachtListProps> = ({ yachts, onYachtPress }) => {
  const renderYacht = ({ item }: { item: Yacht }) => {
    const imageSource = getMainImage(item.imageName);

    return (
      <TouchableOpacity
        style={styles.yachtContainer}
        onPress={() => onYachtPress(item)}
      >
        <Image
          source={imageSource}
          style={styles.yachtImage}
          resizeMode="cover"
        />
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.details}>
            {item.length}m • Built {item.delivered}
          </Text>
          <Text style={styles.builder}>{item.builtBy}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={yachts}
      renderItem={renderYacht}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
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
  },
  yachtImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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

export default YachtList;
