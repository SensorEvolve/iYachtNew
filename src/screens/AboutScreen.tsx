// src/screens/AboutScreen.tsx
import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import * as Application from 'expo-application'; // Requires: npx expo install expo-application

const AboutScreen: React.FC = () => {
  // const appVersion = Application.nativeApplicationVersion || '1.0.0'; // Example using expo-application
  const appVersion = "1.0.1"; // Hardcode for simplicity for now

  const openLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Couldn't load page", err)
    );
  };

  // --- Remember to replace this placeholder! ---
  const contactEmail = "support@superyachtapp.example.com"; // <<< REPLACE THIS EMAIL

  return (
    <ScrollView style={styles.container}>
      {/* --- Header Section --- */}
      <View style={styles.header}>
        {/* <Image source={require('../assets/app-icon.png')} style={styles.logo} /> */}
        <Text style={styles.appName}>Super Yachts App</Text>
        <Text style={styles.version}>Version {appVersion}</Text>
      </View>

      {/* --- About Section --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This App</Text>
        <Text style={styles.paragraph}>
          Welcome to the Super Yachts App! Your pocket guide to the world of
          luxury yachting. Browse detailed specifications, view stunning images,
          and explore information about designers, builders, and owners.
        </Text>
        <Text style={styles.paragraph}>
          Data is sourced from public databases and user contributions. Use the
          map feature (where available) to see reported vessel locations.
        </Text>
      </View>

      {/* --- Data Sources Section --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Sources & Credits</Text>
        <Text style={styles.paragraph}>
          Yacht data and specifications are compiled from various public domain
          sources. Image attributions are provided separately via the 'Image
          Credits' section. Live tracking data relies on AIS information and
          availability may vary.
        </Text>
      </View>

      {/* --- Contact Section --- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact & Feedback</Text>
        <TouchableOpacity
          onPress={() =>
            openLink(
              `mailto:${contactEmail}?subject=Super%20Yacht%20App%20Feedback`,
            )}
        >
          <Text style={styles.link}>Send Feedback</Text>
        </TouchableOpacity>
        {
          /* Optional Links
         <TouchableOpacity onPress={() => openLink('https://yoursuperyachtapp.com/privacy')}>
             <Text style={styles.link}>Privacy Policy</Text>
         </TouchableOpacity>
         */
        }
      </View>

      {/* --- NEW: Disclaimer Section --- */}
      <View style={styles.disclaimerSection}>
        <Text style={styles.disclaimerTitle}>Disclaimer</Text>

        <Text style={styles.subHeading}>Accuracy of Information</Text>
        <Text style={styles.disclaimerParagraph}>
          The Super Yachts App compiles yacht specifications, images, and vessel
          location data from publicly available sources and user contributions.
          While every reasonable effort is made to ensure accuracy and
          timeliness, we do not guarantee the completeness, reliability, or
          accuracy of this information. Use of this data is at your own risk.
        </Text>

        <Text style={styles.subHeading}>Image and Content Copyright</Text>
        <Text style={styles.disclaimerParagraph}>
          Images and textual content included within this app are sourced
          primarily from the public domain, licensed third parties, or
          contributed by users. Proper attribution is provided where necessary.
          If you are the copyright holder of content displayed within this app
          and believe it is used without proper permission or attribution,
          please contact us immediately at {contactEmail}.
        </Text>

        <Text style={styles.subHeading}>AIS Data & Vessel Locations</Text>
        <Text style={styles.disclaimerParagraph}>
          Vessel tracking data, including AIS data, is provided by third-party
          providers and subject to availability. Real-time accuracy or
          availability of AIS tracking data cannot be guaranteed. Do not rely on
          this information for navigation or safety purposes.
        </Text>

        <Text style={styles.subHeading}>Ownership & Sanctions Information</Text>
        <Text style={styles.disclaimerParagraph}>
          Information regarding yacht ownership, seizure, sanctions, or other
          legal statuses is based solely on publicly available sources. The app
          makes no claims regarding the legal accuracy or current validity of
          such information and will not accept liability for inaccuracies or
          outdated information. Statements about sanctions or ownership do not
          constitute allegations, and any disputes or corrections should be
          directed towards the original public sources.
        </Text>

        <Text style={styles.subHeading}>User Contributions</Text>
        <Text style={styles.disclaimerParagraph}>
          Users contributing data or images assert they own the rights or have
          explicit permission to share such content. By submitting any content
          to this app, users grant the app's developers a perpetual,
          non-exclusive license to use, display, and distribute this content
          within the app and related marketing materials.
        </Text>

        <Text style={styles.subHeading}>Liability Limitation</Text>
        <Text style={styles.disclaimerParagraph}>
          Under no circumstances shall the app developers, owners, or associated
          entities be liable for any damages, including without limitation,
          direct or indirect, incidental, consequential, or punitive damages
          arising from the use of, or inability to use, the information provided
          by this app.
        </Text>
      </View>
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // Grouped list background color
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
  logo: {
    width: 80,
    height: 80,
    marginBottom: 15,
    borderRadius: 16,
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
  // Styles for regular content sections
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
  // --- Styles specifically for the Disclaimer section ---
  disclaimerSection: {
    // Similar to section, but maybe slightly different padding/margin if needed
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 15, // More top padding before title
    paddingBottom: 10, // Less bottom padding needed after last paragraph
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#C7C7CC",
    marginBottom: 30, // More space at the very bottom
  },
  disclaimerTitle: {
    fontSize: 20, // Larger title for the whole section
    fontWeight: "bold",
    textAlign: "center", // Center the main title
    marginBottom: 20, // Space after main title
    color: "#1C1C1E",
  },
  subHeading: {
    fontSize: 16, // Slightly smaller than sectionTitle
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 15, // Space above each subheading
    marginBottom: 5, // Space between subheading and paragraph
  },
  disclaimerParagraph: {
    fontSize: 14, // Slightly smaller for disclaimer text
    lineHeight: 20, // Adjust line height
    color: "#555", // Slightly lighter grey than regular paragraph
    marginBottom: 15, // Space after each disclaimer paragraph
  },
});

// --- Make sure this line is at the very end! ---
export default AboutScreen;
