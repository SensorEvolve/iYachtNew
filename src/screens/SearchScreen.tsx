import React, { useState } from "react";
import { View, StyleSheet, TextInput } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";
import YachtList from "../components/YachtList";
import { Yacht } from "../Types/yacht";

type SearchScreenProps = NativeStackScreenProps<RootStackParamList, "Search">;

const SearchScreen = ({ navigation }: SearchScreenProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredYachts, setFilteredYachts] = useState<Yacht[]>([]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search yachts..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <YachtList
        yachts={filteredYachts}
        onYachtPress={(yacht) => navigation.navigate("Detail", { yacht })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  searchInput: {
    margin: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
});

export default SearchScreen;
