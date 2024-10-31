import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import YachtList from "../components/YachtList";
import { Yacht } from "../Types/yacht";
import { Ionicons } from "@expo/vector-icons"; // Make sure to install @expo/vector-icons

interface Props extends NativeStackScreenProps<RootStackParamList, "Home"> {
  yachts: Yacht[];
  isLoading: boolean;
}

const HomeScreen: React.FC<Props> = ({ navigation, yachts, isLoading }) => {
  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <>
          <YachtList yachts={yachts} onYachtPress={handleYachtPress} />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => navigation.navigate("Search", { yachts })}
          >
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  searchButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "black", //change seacch icon
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default HomeScreen;
