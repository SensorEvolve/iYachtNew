import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Yacht } from "../Types/yacht";

// Define CSV column indexes
const CSV_COLUMNS = {
  NAME: 0,
  BUILT_BY: 1,
  YACHT_TYPE: 2,
  LENGTH: 3,
  TOP_SPEED: 4,
  CRUISE_SPEED: 5,
  RANGE: 6,
  CREW: 7,
  DELIVERED: 8,
  BEAM: 9,
  GUESTS: 10,
  REFIT: 11,
  FLAG: 12,
  EXTERIOR_DESIGNER: 13,
  INTERIOR_DESIGNER: 14,
  SHORT_INFO: 15,
  OWNER: 16,
  PRICE: 17,
  SEIZED_BY: 18,
  IMAGE_NAME: 19,
};

// Helper functions for formatting
export const formatLength = (length: string): string => {
  const meters = parseFloat(length);
  if (isNaN(meters)) return length;
  const feet = Math.round(meters * 3.28084);
  return `${meters}m (${feet}ft)`;
};

export const formatPrice = (price: string | undefined): string => {
  if (!price) return "Price on request";
  const num = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  if (isNaN(num)) return "Price on request";
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  return `$${num.toLocaleString()}`;
};

export const loadYachtData = async (): Promise<Yacht[]> => {
  try {
    // Get the CSV file path
    const csvModule = require("../assets/super_yachts.csv");

    // Download the file from the asset
    const asset = Asset.fromModule(csvModule);
    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error("Failed to load CSV file");
    }

    // Read the file content
    const csvContent = await FileSystem.readAsStringAsync(asset.localUri);

    // Split the content into lines and remove empty lines
    const lines = csvContent
      .split("\n")
      .filter((line) => line.trim().length > 0);

    // Skip header row and parse data
    const yachts: Yacht[] = lines
      .slice(1)
      .map((line, index) => {
        const values = line.split(";");

        return {
          id: index.toString(),
          name: values[CSV_COLUMNS.NAME],
          builtBy: values[CSV_COLUMNS.BUILT_BY],
          yachtType: values[CSV_COLUMNS.YACHT_TYPE],
          length: values[CSV_COLUMNS.LENGTH],
          topSpeed: values[CSV_COLUMNS.TOP_SPEED],
          cruiseSpeed: values[CSV_COLUMNS.CRUISE_SPEED],
          range: values[CSV_COLUMNS.RANGE],
          crew: values[CSV_COLUMNS.CREW],
          delivered: values[CSV_COLUMNS.DELIVERED],
          beam: values[CSV_COLUMNS.BEAM],
          guests: values[CSV_COLUMNS.GUESTS],
          refit: values[CSV_COLUMNS.REFIT] || undefined,
          flag: values[CSV_COLUMNS.FLAG],
          exteriorDesigner: values[CSV_COLUMNS.EXTERIOR_DESIGNER],
          interiorDesigner: values[CSV_COLUMNS.INTERIOR_DESIGNER],
          shortInfo: values[CSV_COLUMNS.SHORT_INFO],
          owner: values[CSV_COLUMNS.OWNER] || undefined,
          price: values[CSV_COLUMNS.PRICE] || undefined,
          seizedBy: values[CSV_COLUMNS.SEIZED_BY] || undefined,
          imageName:
            values[CSV_COLUMNS.IMAGE_NAME] ||
            `${values[CSV_COLUMNS.NAME].toLowerCase().replace(/\s+/g, "_")}.png`,
        };
      })
      .filter((yacht) => yacht.name && yacht.name.length > 0);

    console.log(`Loaded ${yachts.length} yachts from CSV`);
    return yachts;
  } catch (error) {
    console.error("Error loading yacht data:", error);
    throw error;
  }
};
