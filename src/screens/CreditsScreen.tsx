// src/screens/CreditsScreen.tsx
import React from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- Corrected import path assuming assets is at the project root ---
import creditsData from "../../src/assets/credits.json";

// Interface matching the fields from your actual CSV -> JSON conversion
interface CreditItem {
  image_description: string; // From 'Image Filename'
  author: string; // From 'Author/User'
  license_url?: string; // From 'License Info' (might be text like "public domain")
  source_url: string; // From 'Source URL'
  modification_notes?: string; // From 'Modification'
}

// --- UPDATED Helper function to handle non-URL license info ---
const getLicenseNameFromUrl = (url: string | undefined): string | null => {
  if (!url) return null; // No URL provided

  const lowerUrl = url.toLowerCase().trim();

  // Check for specific non-URL text first
  if (lowerUrl === "public domain" || lowerUrl.includes("public domain")) {
    return "Public Domain"; // Directly return if it's explicitly Public Domain text
  }

  // Only proceed if it starts with http or https
  if (!lowerUrl.startsWith("http://") && !lowerUrl.startsWith("https://")) {
    // If it's not a recognized text and not a URL, return null
    // Or you could return the text itself if it's potentially informative:
    // return url; // Uncomment this line to display the original text (e.g., "Unknown")
    return null; // Return null to display nothing as the name
  }

  // Try parsing only if it passed the checks
  try {
    const urlObj = new URL(lowerUrl); // Use the already lowercased URL
    const pathSegments = urlObj.pathname.split("/").filter(Boolean); // like ['licenses', 'by-sa', '4.0']

    if (urlObj.hostname.includes("creativecommons.org")) {
      if (
        pathSegments.includes("publicdomain") && pathSegments.includes("zero")
      ) {
        return "CC0 (Public Domain)";
      }
      if (
        pathSegments.includes("publicdomain") && pathSegments.includes("mark")
      ) {
        return "Public Domain Mark";
      }
      if (pathSegments[0] === "licenses") {
        // Format like CC BY-SA 4.0
        const licenseType = pathSegments[1]?.toUpperCase(); // e.g., BY-SA
        const version = pathSegments[2]; // e.g., 4.0
        if (licenseType && version) {
          return `CC ${licenseType} ${version}`;
        }
        // Fallback for simpler URLs like /licenses/by/2.0/
        if (licenseType) {
          return `CC ${licenseType}`;
        }
      }
    }
    // Add checks for other domains like gnu.org if needed
    // else if (urlObj.hostname.includes('gnu.org')) { ... }
  } catch (e) {
    // Log the error and the URL that caused it for easier debugging
    console.error("Error parsing license URL:", url, e);
    // Fallback for valid URLs that couldn't be parsed into a friendly name
    return "License Link"; // Provide generic text
  }

  // Fallback if URL structure wasn't recognized by parsing logic
  return "License Link";
};
// --- End of updated helper function ---

// --- Main Screen Component ---
const CreditsScreen: React.FC = () => {
  // Helper to open links safely
  const openLink = (url: string | undefined) => {
    // Only attempt to open if it's a string starting with http
    if (
      url && typeof url === "string" &&
      (url.startsWith("http://") || url.startsWith("https://"))
    ) {
      Linking.openURL(url).catch((err) =>
        console.error("Couldn't load page", err)
      );
    } else {
      console.warn("Attempted to open invalid link:", url); // Warn if trying to open non-URL
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Image Credits & Licenses</Text>
      <Text style={styles.intro}>
        This app uses images provided by creators under various licenses. We
        thank the contributors and respect the licensing terms. Tap links for
        details.
      </Text>

      {/* Map over the imported JSON data */}
      {creditsData.map((credit: CreditItem, index: number) => {
        // Get the friendly license name using the updated helper
        const friendlyLicenseName = getLicenseNameFromUrl(credit.license_url);
        // Determine if the license URL is actually a clickable link
        const isLicenseLinkable = credit.license_url?.startsWith("http");

        return (
          <View key={index} style={styles.creditItem}>
            {/* Image Description */}
            <Text style={styles.description}>
              {credit.image_description || "Image"}
            </Text>

            {/* Author */}
            <Text style={styles.detailText}>
              By:{" "}
              <Text style={styles.author}>
                {credit.author || "Unknown Author"}
              </Text>
            </Text>

            {/* Source URL Link */}
            {credit.source_url
              ? (
                <TouchableOpacity
                  onPress={() => openLink(credit.source_url)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.link}>Source Page</Text>
                </TouchableOpacity>
              )
              : <Text style={styles.detailText}>Source: Not specified</Text>}

            {/* License URL Link / Text Display */}
            {credit.license_url
              ? (
                <TouchableOpacity
                  onPress={() => openLink(credit.license_url)}
                  disabled={!isLicenseLinkable} // Disable touch if not a link
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.link,
                      !isLicenseLinkable && styles.disabledLink,
                    ]}
                  >
                    License: {friendlyLicenseName || credit.license_url}{" "}
                    {/* Show original text if name null */}
                  </Text>
                </TouchableOpacity>
              )
              : <Text style={styles.detailText}>License: Not specified</Text>}

            {/* Modification Notes */}
            {credit.modification_notes && (
              <Text style={styles.modificationText}>
                Notes: {credit.modification_notes}
              </Text>
            )}
          </View>
        );
      })}

      <Text style={styles.footer}>
        Tap links for image sources and specific license details where
        available.
      </Text>
    </ScrollView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
    backgroundColor: "#fff", // White background for the screen
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#2B2B2B",
  },
  intro: {
    fontSize: 14,
    marginBottom: 25, // More space after intro
    color: "#555",
    lineHeight: 20,
    textAlign: "left", // Align intro text left
  },
  creditItem: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth, // Hairline separator
    borderBottomColor: "#ddd", // Lighter separator
  },
  description: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  detailText: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    marginBottom: 4,
  },
  author: {
    fontWeight: "500",
  },
  link: {
    fontSize: 14,
    color: "#007AFF", // Standard link blue
    lineHeight: 20,
    marginTop: 4, // Consistent spacing
    // textDecorationLine: 'underline', // Optional: Underline links
  },
  disabledLink: { // Style for non-clickable license text
    color: "#666", // Grey out non-link text
  },
  modificationText: {
    fontSize: 13,
    color: "#777",
    fontStyle: "italic",
    marginTop: 5,
  },
  footer: {
    marginTop: 25,
    marginBottom: 40,
    textAlign: "center",
    fontSize: 12,
    color: "#888",
  },
});

// --- Make sure this export line is present ---
export default CreditsScreen;
