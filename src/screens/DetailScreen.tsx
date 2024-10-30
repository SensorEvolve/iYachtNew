import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../App";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

const DetailScreen: React.FC<Props> = ({ route }) => {
  const { yacht } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Design Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Design</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Exterior Designer</Text>
          <Text style={styles.value}>{yacht.exteriorDesigner}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Interior Designer</Text>
          <Text style={styles.value}>{yacht.interiorDesigner}</Text>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{yacht.shortInfo}</Text>
      </View>

      {/* Ownership Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ownership</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Owner</Text>
          <Text style={styles.value}>{yacht.owner}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Price</Text>
          <Text style={styles.value}>{yacht.price}</Text>
        </View>
        {yacht.seizedBy && (
          <View style={styles.detailRow}>
            <Text style={[styles.label, styles.seizedLabel]}>Status</Text>
            <Text style={[styles.value, styles.seizedValue]}>
              Seized by {yacht.seizedBy}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 10,
    color: "#000000",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E5E5",
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
    flex: 2,
    textAlign: "right",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  seizedLabel: {
    color: "#666666",
  },
  seizedValue: {
    color: "#666666",
    fontStyle: "italic",
  },
});

export default DetailScreen;
