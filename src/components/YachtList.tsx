//YachtList

import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Yacht } from "../Types/yacht";
import { formatLength } from "../utils/dataParser";

const yachtImages = {
  "azzam.png": require("../assets/yachts/azzam.png"),
  "Fulk_Al_Salamah.png": require("../assets/yachts/Fulk_Al_Salamah.png"),
};

interface YachtListProps {
  yachts: Yacht[];
  onYachtPress: (yacht: Yacht) => void;
}

const YachtList: React.FC<YachtListProps> = ({ yachts, onYachtPress }) => {
  const renderYachtItem = ({ item }: { item: Yacht }) => (
    <TouchableOpacity style={styles.card} onPress={() => onYachtPress(item)}>
      <Image
        source={
          yachtImages[item.imageName as keyof typeof yachtImages] ||
          yachtImages["azzam.png"]
        }
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.contentContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.length}>{formatLength(item.length)}</Text>
          <Text style={styles.builder}>{item.builtBy}</Text>
        </View>
        <View style={styles.specsRow}>
          <Text style={styles.spec}>Built {item.delivered}</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.spec}>{item.guests} Guests</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={yachts}
      renderItem={renderYachtItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  length: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  builder: {
    fontSize: 16,
    color: "#666",
  },
  specsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  spec: {
    fontSize: 14,
    color: "#888",
  },
  dot: {
    fontSize: 14,
    color: "#888",
    marginHorizontal: 6,
  },
});

export default YachtList;
