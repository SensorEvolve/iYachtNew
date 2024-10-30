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
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { Yacht } from "../Types/yacht";

const yachtImages = {
  "azzam.png": require("../assets/yachts/azzam.png"),
  "Fulk_Al_Salamah.png": require("../assets/yachts/Fulk_Al_Salamah.png"),
  "rev_ocean.png": require("../assets/yachts/rev_ocean.png"),
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

interface HomeScreenProps extends Props {
  yachts: Yacht[];
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, yachts }) => {
  const renderYachtItem = ({ item }: { item: Yacht }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate("Detail", { yacht: item })}
    >
      <Image
        source={
          yachtImages[`${item.imageName}.png` as keyof typeof yachtImages] ||
          yachtImages["azzam.png"]
        }
        style={styles.thumbnail}
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

  return (
    <FlatList
      data={yachts}
      renderItem={renderYachtItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: "row",
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
  thumbnail: {
    width: 120,
    height: 90,
    backgroundColor: "#f5f5f5",
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#000",
  },
  details: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  builder: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});

export default HomeScreen;
