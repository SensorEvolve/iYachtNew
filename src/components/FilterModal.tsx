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
  // ... (same styles as before)
});

export default FilterModal;
