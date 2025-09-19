import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import { Yacht, CSV_COLUMNS, YachtLocation } from "../types/yacht";
import { locationService } from "../services/YachtLocationService";

const LOG_PREFIX = "📝 [DataParser]";

const validateAndFormatDate = (dateString: string): string => {
  try {
    if (!dateString) {
      return new Date().toISOString();
    }

    // Handle various date formats
    let date: Date;

    // Clean up the date string
    const cleanDateString = dateString
      .replace(".000Z", "Z") // Handle .000Z format
      .replace(/\s+/g, "T") // Replace spaces with T
      .replace(/(\d{4}-\d{2}-\d{2})(?:T?)(\d{2}:\d{2}:\d{2})/, "$1T$2"); // Ensure T separator

    date = new Date(cleanDateString);

    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try parsing as UTC if direct parsing fails
    const utcDate = new Date(dateString + "Z");
    if (!isNaN(utcDate.getTime())) {
      return utcDate.toISOString();
    }

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
): {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status: number;
  timestamp: string;
} | null => {
  if (!locationString) return null;

  try {
    console.log(`${LOG_PREFIX} Parsing location: ${locationString}`);
    let [lat, lon, speed = 0, course = 0] = locationString
      .split(",")
      .map((value) => {
        const num = parseFloat(value.trim());
        return isNaN(num) ? 0 : num;
      });

    // Validate coordinates with more lenient bounds for edge cases
    if (
      typeof lat === "number" &&
      !isNaN(lat) &&
      typeof lon === "number" &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    ) {
      const timestamp = validateAndFormatDate(
        entryDate || new Date().toISOString()
      );

      // Ensure speed and course are within valid ranges
      speed = Math.max(0, Math.min(speed, 100)); // Cap speed at 100 knots
      course = ((course % 360) + 360) % 360; // Normalize course to 0-359

      return {
        lat,
        lon,
        speed,
        course,
        status: 5, // Default to Moored for manual positions
        timestamp,
      };
    } else {
      console.warn(
        `${LOG_PREFIX} Invalid coordinates: lat=${lat}, lon=${lon} from string: ${locationString}`
      );
    }
  } catch (error) {
    console.warn(
      `${LOG_PREFIX} Error parsing location for: ${locationString}`,
      error
    );
  }
  return null;
};

export const loadYachtData = async (): Promise<Yacht[]> => {
  try {
    console.log(`${LOG_PREFIX} Starting yacht data load`);
    const csvModule = require("../assets/super_yachts.csv");
    const asset = Asset.fromModule(csvModule);
    await asset.downloadAsync();
    const csvContent = await FileSystem.readAsStringAsync(asset.localUri!);

    const lines = csvContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.includes("Name"));

    console.log(`${LOG_PREFIX} Processing ${lines.length} yacht entries`);
    const locationUpdates: YachtLocation[] = [];
    const processedMMSIs = new Set<string>();

    const yachts = lines.map((line, index) => {
      const values = line.split(";").map((v) => v.trim());
      const mmsi = values[CSV_COLUMNS.MMSI];
      const locationString = values[CSV_COLUMNS.LOCATION_LAT_LON];
      const entryDate = values[CSV_COLUMNS.ENTRY_DATE];

      // Process location if we have MMSI and haven't processed this yacht yet
      if (mmsi && !processedMMSIs.has(mmsi) && locationString) {
        processedMMSIs.add(mmsi);
        console.log(
          `${LOG_PREFIX} Processing MMSI ${mmsi} with location ${locationString}`
        );

        const locationData = parseLocation(locationString, entryDate);
        if (locationData) {
          console.log(
            `${LOG_PREFIX} Valid location for MMSI: ${mmsi}
            Lat/Lon: ${locationData.lat}, ${locationData.lon}
            Speed/Course: ${locationData.speed}kts, ${locationData.course}°
            Timestamp: ${locationData.timestamp}`
          );

          locationUpdates.push({
            mmsi,
            lat: locationData.lat,
            lon: locationData.lon,
            speed: locationData.speed,
            course: locationData.course,
            status: locationData.status,
            timestamp: locationData.timestamp,
            source: "MANUAL",
          });
        } else {
          console.log(`${LOG_PREFIX} No valid location for MMSI: ${mmsi}`);
        }
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
        mmsi: mmsi || "",
        isFavorite: false, // Default value for isFavorite
      };
    });

    if (locationUpdates.length > 0) {
      console.log(
        `${LOG_PREFIX} Initializing ${locationUpdates.length} manual locations`
      );
      await locationService.initializeFromCSV(locationUpdates);
    }

    console.log(`${LOG_PREFIX} Successfully loaded ${yachts.length} yachts`);
    return yachts;
  } catch (error) {
    console.error(`${LOG_PREFIX} Error loading yacht data:`, error);
    throw error;
  }
};
