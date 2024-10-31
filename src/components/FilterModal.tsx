import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import type { YachtFilters } from "../Types/yacht";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: YachtFilters) => void;
  filters: YachtFilters;
}

const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  onApply,
  filters,
}) => {
  const [localFilters, setLocalFilters] = useState<YachtFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleReset = () => {
    setLocalFilters({});
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter Yachts</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Length (meters)</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.input}
                  placeholder="Min"
                  value={localFilters.lengthMin?.toString() || ""}
                  onChangeText={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      lengthMin: parseFloat(value) || undefined,
                    })
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.rangeSeparator}>to</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Max"
                  value={localFilters.lengthMax?.toString() || ""}
                  onChangeText={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      lengthMax: parseFloat(value) || undefined,
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Year Built</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.input}
                  placeholder="From"
                  value={localFilters.yearMin?.toString() || ""}
                  onChangeText={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      yearMin: parseFloat(value) || undefined,
                    })
                  }
                  keyboardType="numeric"
                />
                <Text style={styles.rangeSeparator}>to</Text>
                <TextInput
                  style={styles.input}
                  placeholder="To"
                  value={localFilters.yearMax?.toString() || ""}
                  onChangeText={(value) =>
                    setLocalFilters({
                      ...localFilters,
                      yearMax: parseFloat(value) || undefined,
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Builder</Text>
              <TextInput
                style={styles.fullInput}
                placeholder="Filter by builder"
                value={localFilters.builder || ""}
                onChangeText={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    builder: value || undefined,
                  })
                }
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Yacht Type</Text>
              <TextInput
                style={styles.fullInput}
                placeholder="Filter by yacht type"
                value={localFilters.yachtType || ""}
                onChangeText={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    yachtType: value || undefined,
                  })
                }
              />
            </View>
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.applyButton]}
              onPress={handleApply}
            >
              <Text style={[styles.buttonText, styles.applyButtonText]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  resetText: {
    color: "#007AFF",
    fontSize: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  rangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  fullInput: {
    height: 40,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  rangeSeparator: {
    marginHorizontal: 12,
    color: "#666",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
  },
  applyButton: {
    backgroundColor: "#007AFF",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  applyButtonText: {
    color: "white",
  },
});
export default FilterModal;
