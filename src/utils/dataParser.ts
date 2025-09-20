import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Yacht, CSV_COLUMNS, YachtLocation } from "../types/yacht";
// The direct dependency on locationService is now removed.

const LOG_PREFIX = "📝 [DataParser]";

// (No changes to validateAndFormatDate and parseLocation helper functions)
const validateAndFormatDate = (dateString: string): string => {
  try {
    if (!dateString) return new Date().toISOString();
    const cleanDateString = dateString
      .replace(".000Z", "Z")
      .replace(/\s+/g, "T")
      .replace(/(\d{4}-\d{2}-\d{2})(?:T?)(\d{2}:\d{2}:\d{2})/, "$1T$2");
    let date = new Date(cleanDateString);
    if (!isNaN(date.getTime())) return date.toISOString();
    const utcDate = new Date(dateString + "Z");
    if (!isNaN(utcDate.getTime())) return utcDate.toISOString();
    console.warn(
      `${LOG_PREFIX} Invalid date format: ${dateString}, using current date`
    );
    return new Date().toISOString();
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} Error parsing date: ${dateString}, using current date`,
      error
    );
    return new Date().toISOString();
  }
};

const parseLocation = (
  locationString: string,
  entryDate: string
): Omit<YachtLocation, "mmsi"> | null => {
  if (!locationString) return null;
  try {
    let [lat, lon, speed = 0, course = 0] = locationString
      .split(",")
      .map((v) => parseFloat(v.trim()) || 0);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return {
        lat,
        lon,
        speed,
        course,
        status: 5,
        timestamp: validateAndFormatDate(entryDate),
        source: "MANUAL",
      };
    }
    console.warn(`${LOG_PREFIX} Invalid coordinates in CSV: ${locationString}`);
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} Error parsing location: ${locationString}`,
      error
    );
  }
  return null;
};

// The main function is now simplified.
export const loadYachtData = async (): Promise<Yacht[]> => {
  try {
    console.log(`${LOG_PREFIX} Starting yacht data load from CSV`);
    const csvModule = require("../assets/super_yachts.csv");
    const asset = Asset.fromModule(csvModule);
    await asset.downloadAsync();
    const csvContent = await FileSystem.readAsStringAsync(asset.localUri!);

    const lines = csvContent
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines[0].includes("Name")) lines.shift(); // Remove header row

    console.log(`${LOG_PREFIX} Processing ${lines.length} yacht entries`);

    const yachts = lines.map((line, index) => {
      const values = line.split(";").map((v) => v.trim());
      const mmsi = values[CSV_COLUMNS.MMSI];

      const yacht: Yacht = {
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
        mmsi: mmsi || "",
      };

      // If a manual location exists in the CSV, parse it and attach it.
      const locationString = values[CSV_COLUMNS.LOCATION_LAT_LON];
      if (mmsi && locationString) {
        const locationData = parseLocation(
          locationString,
          values[CSV_COLUMNS.ENTRY_DATE]
        );
        if (locationData) {
          yacht.location = { ...locationData, mmsi }; // Attach the manual location here
        }
      }
      return yacht;
    });

    console.log(`${LOG_PREFIX} Successfully loaded ${yachts.length} yachts`);
    return yachts;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error loading yacht data:`, error);
    throw error;
  }
};
