// src/screens/AboutScreen.tsx
import React from "react";
import {
  Image, // << 1. Ensure Image is imported
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";

const AboutScreen: React.FC = () => {
  const appName = Constants.expoConfig?.name || "Yacht Tracker";
  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  const contactEmail = "support@superyachtapp.example.com"; // <<< REPLACE THIS EMAIL
  const mailSubject = `${encodeURIComponent(appName)} App Feedback`;

  return (
    <ScrollView style={styles.container}>
      {/* --- Header Section --- */}
      <View style={styles.header}>
        {/* VVVV --- 2. ADD IMAGE COMPONENT HERE --- VVVV */}
        <Image
          // 3. Use require with RELATIVE path from this file to your assets folder
          //    Adjust '../../assets/icon.png' if your structure differs
          //    (e.g., if assets is inside src, it might be '../assets/icon.png')
          source={require("../../assets/icon.png")}
          style={styles.logo} // Use existing logo style
        />
        {/* ^^^^ --- END IMAGE COMPONENT --- ^^^^ */}
        <Text style={styles.appName}>{appName}</Text>
        <Text style={styles.version}>Version {appVersion}</Text>
      </View>

      {/* --- About Section --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This App</Text>
        <Text style={styles.paragraph}>
          Welcome to{" "}
          {appName}! Your pocket guide to the world of luxury yachting. Browse
          detailed specifications, view stunning images, explore information
          about designers, builders, and owners, and use the map feature (where
          available) to see reported vessel locations.
        </Text>
      </View>

      {/* --- Contact Section --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Feedback</Text>
        <TouchableOpacity
          onPress={() =>
            openLink(`mailto:${contactEmail}?subject=${mailSubject}`)}
        >
          <Text style={styles.link}>Send Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* --- Disclaimer Section --- */}
      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerTitle}>Disclaimer</Text>

        <Text style={styles.subHeading}>Data Accuracy & Sources</Text>
        <Text style={styles.disclaimerParagraph}>
          The {appName}{" "}
          compiles yacht specifications, images, ownership details, and vessel
          location data primarily from publicly available sources and user
          contributions. While reasonable efforts are made to ensure accuracy
          and timeliness, we do not guarantee the completeness, reliability, or
          accuracy of any information. Use of all data provided by this app is
          at your own risk. Specific details regarding image attributions can be
          found in the 'Image Credits' section (if applicable).
        </Text>

        <Text style={styles.subHeading}>Image and Content Copyright</Text>
        <Text style={styles.disclaimerParagraph}>
          Images and textual content are sourced primarily from the public
          domain, licensed third parties, or contributed by users. Proper
          attribution is provided where feasible. If you are the copyright
          holder of content displayed and believe it is used improperly, please
          contact us immediately at {contactEmail}.
        </Text>

        <Text style={styles.subHeading}>AIS Data & Vessel Locations</Text>
        <Text style={styles.disclaimerParagraph}>
          Vessel tracking data, including AIS, relies on third-party providers
          and its availability and real-time accuracy cannot be guaranteed. This
          information should not be used for navigation or safety-critical
          purposes.
        </Text>

        <Text style={styles.subHeading}>Ownership & Sanctions Information</Text>
        <Text style={styles.disclaimerParagraph}>
          Information regarding yacht ownership, seizure, sanctions, or other
          legal statuses is based solely on publicly available sources. The app
          makes no claims regarding the legal accuracy or current validity of
          such information. Statements do not constitute allegations, and any
          disputes or corrections should be directed towards the original public
          sources.
        </Text>

        <Text style={styles.subHeading}>User Contributions</Text>
        <Text style={styles.disclaimerParagraph}>
          Users contributing content assert they have the necessary rights or
          permissions. By submitting content, users grant the app a perpetual,
          non-exclusive license to use, display, and distribute this content
          within the app and related materials.
        </Text>

        <Text style={styles.subHeading}>Liability Limitation</Text>
        <Text style={styles.disclaimerParagraph}>
          Under no circumstances shall the app developers, owners, or associated
          entities be liable for any damages arising from the use of, or
          inability to use, the information provided by this app.
        </Text>
      </View>
    </ScrollView>
  );
};

// --- Styles (logo style already exists) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  header: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#C7C7CC",
    marginBottom: 20,
  },
  logo: { // Style for the icon
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 16, // Makes it slightly rounded if square
    resizeMode: "contain", // Adjust resizeMode as needed ('cover', 'stretch', etc.)
  },
  appName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1C1C1E",
    textAlign: "center",
    marginBottom: 5,
  },
  version: {
    fontSize: 14,
    color: "#8A8A8E",
  },
  section: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#C7C7CC",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1C1C1E",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 21,
    color: "#3C3C43",
    marginBottom: 10,
  },
  link: {
    fontSize: 15,
    lineHeight: 21,
    color: "#007AFF",
    marginTop: 5,
    marginBottom: 5,
  },
  disclaimerSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#C7C7CC",
    marginBottom: 30,
  },
  disclaimerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1C1C1E",
  },
  subHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 15,
    marginBottom: 5,
  },
  disclaimerParagraph: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    marginBottom: 15,
  },
});

export default AboutScreen;
