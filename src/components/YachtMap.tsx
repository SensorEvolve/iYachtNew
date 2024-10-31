// components/YachtMap.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";

interface YachtMapProps {
  latitude?: string | number;
  longitude?: string | number;
  name?: string;
  lastSeen?: string;
}

export const YachtMap: React.FC<YachtMapProps> = ({
  latitude,
  longitude,
  name,
  lastSeen = "Last known location",
}) => {
  const location = {
    latitude: parseFloat(latitude as string) || 17.896179,
    longitude: parseFloat(longitude as string) || -62.849781,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={styles.section}>
      <Text style={styles.lastSeen}>{lastSeen}</Text>
      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={location}>
          <Marker coordinate={location} title={name} />
        </MapView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginHorizontal: 15,
  },
  lastSeen: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

// Usage in DetailScreen.tsx:
<ScrollView>
  {/* Your existing yacht details and ownership info */}

  <YachtMap
    latitude={yacht.Latitude}
    longitude={yacht.Longitude}
    name={yacht.Name}
    lastSeen={`Yacht last seen`}
  />
</ScrollView>;
