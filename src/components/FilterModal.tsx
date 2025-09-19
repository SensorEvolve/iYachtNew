import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, TextInput, Button } from "react-native";
import { YachtFilters } from "../types/yacht";

// Define the props that FilterModal will accept
interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: YachtFilters) => void;
  initialFilters: YachtFilters;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const [filters, setFilters] = useState<YachtFilters>(initialFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  // Helper to update a specific filter value
  const updateFilter = (key: keyof YachtFilters, value: string) => {
    const numValue = parseInt(value, 10);
    setFilters((prev) => ({
      ...prev,
      [key]: isNaN(numValue) ? undefined : numValue,
    }));
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Detailed Filters</Text>

          {/* Example Filter: Min Length */}
          <Text style={styles.label}>Min Length (m)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g., 50"
            onChangeText={(text) => updateFilter("lengthMin", text)}
            defaultValue={filters.lengthMin?.toString()}
          />

          {/* Example Filter: Max Length */}
          <Text style={styles.label}>Max Length (m)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="e.g., 100"
            onChangeText={(text) => updateFilter("lengthMax", text)}
            defaultValue={filters.lengthMax?.toString()}
          />

          {/* Add more TextInput fields for yearMin, yearMax, builder, etc. here */}

          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={onClose} color="#666" />
            <Button title="Apply Filters" onPress={handleApply} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalTitle: {
    marginBottom: 15,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },
  label: {
    alignSelf: "flex-start",
    marginTop: 10,
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 10,
    width: "100%",
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
});

export default FilterModal;
