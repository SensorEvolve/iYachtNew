import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  FlatList,
  Image,
} from "react-native";
import { BlurView } from "expo-blur";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../Types/navigation";
import type { Yacht } from "../Types/yacht";
import { getMainImage } from "../utils/imageUtils";

type Props = NativeStackScreenProps<RootStackParamList, "Search">;

const SearchScreen: React.FC<Props> = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [yachts, setYachts] = useState<Yacht[]>([]);
  const [filteredYachts, setFilteredYachts] = useState<Yacht[]>([]);
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (route.params?.yachts) {
      const initialYachts = route.params.yachts;
      setYachts(initialYachts);
      setFilteredYachts([]);
    }
  }, [route.params?.yachts]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setFilteredYachts([]);
      return;
    }

    const filtered = yachts.filter((yacht) => {
      const searchFields = [
        yacht.name,
        yacht.builtBy,
        yacht.owner,
        yacht.seizedBy,
        yacht.shortInfo, // Added About text
        yacht.exteriorDesigner, // Added exterior designer
        yacht.interiorDesigner, // Added interior designer
      ].map((field) => (field || "").toLowerCase());

      const queryLower = query.toLowerCase();
      return searchFields.some((field) => field.includes(queryLower));
    });

    setFilteredYachts(filtered);
  };

  const handleYachtPress = (yacht: Yacht) => {
    navigation.navigate("Detail", { yacht });
  };

  const handleDismiss = () => {
    navigation.goBack();
  };

  const renderYachtItem = ({ item }: { item: Yacht }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleYachtPress(item)}
      activeOpacity={0.7}
    >
      <Image
        source={getMainImage(item.imageName)}
        style={styles.yachtImage}
        resizeMode="cover"
      />
      <View style={styles.yachtInfo}>
        <Text style={styles.yachtName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.yachtDetails}>
          {item.length}m • Built {item.delivered}
        </Text>
        <Text style={styles.yachtBuilder} numberOfLines={1}>
          {item.builtBy}
          {item.seizedBy && <Text style={styles.seizedText}> • Seized</Text>}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <BlurView intensity={25} tint="light" style={styles.blurContainer}>
        <SafeAreaView style={styles.contentContainer}>
          <View style={styles.searchHeader}>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
            >
              <Text style={styles.dismissButtonText}>✕</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.searchInput}
              placeholder="Search yachts, owners..."
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
          </View>

          {searchQuery.trim() !== "" && (
            <View style={styles.resultsContainer}>
              {filteredYachts.length > 0 ? (
                <FlatList
                  data={filteredYachts}
                  renderItem={renderYachtItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.resultsList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Text style={styles.noResults}>No yachts found</Text>
              )}
            </View>
          )}
        </SafeAreaView>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
  contentContainer: {
    flex: 1,
  },
  searchHeader: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  dismissButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  dismissButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
    padding: 15,
  },
  resultItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
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
  yachtImage: {
    width: 100,
    height: 100,
  },
  yachtInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  yachtName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1a1a1a",
  },
  yachtDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  yachtBuilder: {
    fontSize: 14,
    color: "#666",
  },
  seizedText: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  noResults: {
    textAlign: "center",
    color: "#666",
    marginTop: 20,
    fontSize: 16,
  },
});

export default SearchScreen;
