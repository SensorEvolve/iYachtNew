// src/screens/MoreScreen.tsx
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons"; // Make sure you have @expo/vector-icons installed

// --- IMPORTANT: Adjust this import path if needed ---
// It should point to the file where MoreStackParamList is defined (likely MoreStackNavigator.tsx)
import { MoreStackParamList } from "../navigators/MoreStackNavigator";

// Define the specific type for navigation prop used within the More stack,
// specifically for the 'MoreList' screen (this screen).
type MoreScreenNavigationProp = NativeStackNavigationProp<
  MoreStackParamList,
  "MoreList"
>;

const MoreScreen: React.FC = () => {
  // Get the navigation object specific to the More stack
  const navigation = useNavigation<MoreScreenNavigationProp>();

  // --- Define the menu items ---
  // Each object contains:
  // name: Text displayed on the button
  // screen: The route name defined in MoreStackParamList (in MoreStackNavigator.tsx) to navigate to
  // icon: The name of the Ionicons icon to display
  const menuItems = [
    {
      name: "About App",
      screen: "About", // Navigates to the 'About' route in MoreStackNavigator
      icon: "information-circle-outline" as const, // Explicitly type icon name
    },
    {
      name: "Image Credits",
      screen: "Credits", // Navigates to the 'Credits' route in MoreStackNavigator
      icon: "document-text-outline" as const,
    },
    // --- Add more items here later if needed ---
    // {
    //     name: 'Settings',
    //     screen: 'Settings', // You would need to add 'Settings' screen to MoreStackNavigator
    //     icon: 'settings-outline' as const
    // },
  ];

  return (
    // Use ScrollView in case you add many items later
    <ScrollView style={styles.container}>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.menuItem}
          // Navigate to the screen defined in the item object
          // We use 'as keyof MoreStackParamList' for stricter TypeScript checking
          onPress={() =>
            navigation.navigate(item.screen as keyof MoreStackParamList)
          }
          activeOpacity={0.7} // Provide visual feedback on touch
        >
          {/* Icon */}
          <Ionicons
            name={item.icon}
            size={24}
            color="#4F4F4F"
            style={styles.icon}
          />
          {/* Text Label */}
          <Text style={styles.menuText}>{item.name}</Text>
          {/* Chevron icon indicating navigation */}
          <Ionicons name="chevron-forward-outline" size={22} color="#C7C7CC" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // Use a standard iOS-like grouped list background color
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14, // Adjust vertical padding
    paddingHorizontal: 16,
    backgroundColor: "#fff", // White background for rows
    borderBottomWidth: StyleSheet.hairlineWidth, // Use hairline for subtle separators
    borderBottomColor: "#C7C7CC", // Standard separator color
  },
  icon: {
    marginRight: 16, // Space between icon and text
    width: 24, // Fixed width for alignment
    textAlign: "center",
  },
  menuText: {
    flex: 1, // Make text take available space
    fontSize: 17, // Standard iOS font size
    color: "#000", // Standard text color
  },
});

export default MoreScreen;
