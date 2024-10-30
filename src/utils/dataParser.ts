import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Yacht } from "../Types/yacht";

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
    // Get the CSV file directly from src
    const csvModule = require("./super_yachts.csv");
    const csvContent = await FileSystem.readAsStringAsync(csvModule);

    // Convert the content format
    const formattedContent = csvContent
      .replace(/\*\*/g, "") // Remove asterisks
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    // Split into lines and filter out empty ones and header
    const lines = formattedContent
      .split("\n")
      .filter((line) => line.trim().length > 0 && !line.includes("Name"));

    console.log(`Processing ${lines.length} lines`);

    // Parse data
    const yachts: Yacht[] = lines
      .map((line, index) => {
        const values = line.split(";").map((v) => v.trim());

        if (values.length < Object.keys(CSV_COLUMNS).length) {
          console.warn(`Skipping line ${index + 1}: insufficient values`);
          return null;
        }

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
      .filter(
        (yacht): yacht is Yacht =>
          yacht !== null && yacht.name && yacht.name.length > 0,
      );

    console.log(`Successfully loaded ${yachts.length} yachts`);
    if (yachts.length > 0) {
      console.log("First yacht:", {
        name: yachts[0].name,
        builder: yachts[0].builtBy,
        length: yachts[0].length,
      });
    }

    return yachts;
  } catch (error) {
    console.error("Error loading yacht data:", error);
    throw error;
  }
};
