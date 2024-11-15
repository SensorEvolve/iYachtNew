import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Yacht, CSV_COLUMNS } from "../Types/yacht";

// Version header constants
const CSV_VERSION = "1.0.0";
const CSV_HEADER_MARKER = "#VERSION";

export const loadYachtData = async (): Promise<Yacht[]> => {
  try {
    const csvModule = require("../assets/super_yachts.csv");
    const asset = Asset.fromModule(csvModule);
    await asset.downloadAsync();
    const csvContent = await FileSystem.readAsStringAsync(asset.localUri!);

    // Split and clean lines
    const allLines = csvContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Check for version header
    let dataLines = allLines;
    if (allLines[0].startsWith(CSV_HEADER_MARKER)) {
      const [marker, version, lastUpdated] = allLines[0].split(";");
      console.log(`CSV Version: ${version}, Last Updated: ${lastUpdated}`);
      dataLines = allLines.slice(1);
    }

    // Filter out header row and empty lines
    const validLines = dataLines.filter((line) => !line.includes("Name"));
    console.log(`Processing ${validLines.length} yacht entries`);

    // Track validation issues
    const validationIssues: string[] = [];

    const yachts = validLines.map((line, index) => {
      const values = line.split(";").map((v) => v.trim());

      // Basic validation
      if (!values[CSV_COLUMNS.NAME]) {
        validationIssues.push(`Line ${index + 1}: Missing yacht name`);
      }
      if (!values[CSV_COLUMNS.LENGTH]) {
        validationIssues.push(`Line ${index + 1}: Missing yacht length`);
      }

      return {
        id: String(index),
        name: values[CSV_COLUMNS.NAME] || "",
        builtBy: values[CSV_COLUMNS.BUILT_BY] || "",
        yachtType: values[CSV_COLUMNS.YACHT_TYPE] || "",
        length: values[CSV_COLUMNS.LENGTH] || "",
        topSpeed: values[CSV_COLUMNS.TOP_SPEED] || "",
        cruiseSpeed: values[CSV_COLUMNS.CRUISE_SPEED] || "",
        range: values[CSV_COLUMNS.RANGE] || "",
        crew: values[CSV_COLUMNS.CREW] || "",
        delivered: values[CSV_COLUMNS.DELIVERED] || "",
        beam: values[CSV_COLUMNS.BEAM] || "",
        guests: values[CSV_COLUMNS.GUESTS] || "",
        refit: values[CSV_COLUMNS.REFIT] || "",
        flag: values[CSV_COLUMNS.FLAG] || "",
        exteriorDesigner: values[CSV_COLUMNS.EXTERIOR_DESIGNER] || "",
        interiorDesigner: values[CSV_COLUMNS.INTERIOR_DESIGNER] || "",
        shortInfo: values[CSV_COLUMNS.SHORT_INFO] || "",
        owner: values[CSV_COLUMNS.OWNER] || "",
        price: values[CSV_COLUMNS.PRICE] || "",
        seizedBy: values[CSV_COLUMNS.SEIZED_BY] || "",
        imageName:
          values[CSV_COLUMNS.IMAGE_NAME] ||
          values[CSV_COLUMNS.NAME].toLowerCase().replace(/\s+/g, "_"),
        mmsi: values[CSV_COLUMNS.MMSI] || "",
        isFavorite: false,
      };
    });

    // Log any validation issues
    if (validationIssues.length > 0) {
      console.warn("Validation issues found:", validationIssues);
    }

    console.log(`Successfully loaded ${yachts.length} yachts`);
    return yachts;
  } catch (error) {
    console.error("Error loading yacht data:", error);
    throw error;
  }
};

// Helper function to generate version header for CSV
export const generateCSVHeader = (): string => {
  return `${CSV_HEADER_MARKER};${CSV_VERSION};${new Date().toISOString()}`;
};
