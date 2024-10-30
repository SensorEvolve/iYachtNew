import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { Yacht } from "../Types/yacht";

interface YachtDetailProps {
  yacht: Yacht;
}

const YachtDetail: React.FC<YachtDetailProps> = ({ yacht }) => {
  const windowWidth = Dimensions.get("window").width;

  const renderInfoRow = (label: string, value: string | undefined) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Image */}
      <View style={styles.imageContainer}>
        <Image
          source={require(`../assets/yachts/${yacht.imageName}.png`)}
          style={[styles.heroImage, { width: windowWidth }]}
          resizeMode="cover"
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.yachtName}>{yacht.name}</Text>
          <Text style={styles.mainSpecs}>
            {yacht.length}m • Built {yacht.delivered}
          </Text>
          <Text style={styles.builder}>Built by {yacht.builtBy}</Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{yacht.shortInfo}</Text>
        </View>

        {/* Key Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Specifications</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Length</Text>
              <Text style={styles.statValue}>{yacht.length}m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Beam</Text>
              <Text style={styles.statValue}>{yacht.beam}m</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Guests</Text>
              <Text style={styles.statValue}>{yacht.guests}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Crew</Text>
              <Text style={styles.statValue}>{yacht.crew}</Text>
            </View>
          </View>
        </View>

        {/* Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          {renderInfoRow("Top Speed", `${yacht.topSpeed} knots`)}
          {renderInfoRow("Cruise Speed", `${yacht.cruiseSpeed} knots`)}
          {renderInfoRow("Range", `${yacht.range} nm`)}
        </View>

        {/* Design */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Design</Text>
          {renderInfoRow("Yacht Type", yacht.yachtType)}
          {renderInfoRow("Exterior Designer", yacht.exteriorDesigner)}
          {renderInfoRow("Interior Designer", yacht.interiorDesigner)}
          {renderInfoRow("Flag", yacht.flag)}
        </View>

        {/* Ownership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ownership</Text>
          {renderInfoRow("Owner", yacht.owner)}
          {renderInfoRow("Price", yacht.price)}
          {yacht.seizedBy && (
            <View style={styles.seizedContainer}>
              <Text style={styles.seizedText}>
                🚫 Seized by {yacht.seizedBy}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  imageContainer: {
    backgroundColor: "#f5f5f5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroImage: {
    height: 300,
  },
  content: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  yachtName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  mainSpecs: {
    fontSize: 18,
    color: "#666666",
    marginBottom: 4,
  },
  builder: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333333",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    margin: -8,
  },
  statItem: {
    width: "50%",
    padding: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
    flex: 1,
    textAlign: "right",
  },
  seizedContainer: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#FFF0F0",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FF4444",
  },
  seizedText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FF4444",
  },
});

export default YachtDetail;
