import AsyncStorage from "@react-native-async-storage/async-storage";
import { YachtLocation } from "../Types/yacht";

interface LocationUpdate {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
  timestamp?: string;
}

const STORAGE_KEY = "@yacht_locations";
const LOG_PREFIX = "🛥️ [LocationService]";

class YachtLocationService {
  private locations: Map<string, YachtLocation> = new Map();
  private initialized: boolean = false;
  private initializationPromise: Promise<void>;

  constructor() {
    console.log(`${LOG_PREFIX} Service created`);
    this.initializationPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log(`${LOG_PREFIX} Starting initialization`);
      await this.loadLocations();
      this.initialized = true;
      console.log(`${LOG_PREFIX} Initialization complete`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw error;
    }
  }

  public async waitForInitialization(): Promise<void> {
    await this.initializationPromise;
  }

  private async loadLocations(): Promise<void> {
    try {
      console.log(`${LOG_PREFIX} Loading stored locations`);
      const storedLocations = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedLocations) {
        const parsed = JSON.parse(storedLocations);
        console.log(
          `${LOG_PREFIX} Parsed data type:`,
          Array.isArray(parsed) ? "array" : typeof parsed,
        );

        if (Array.isArray(parsed)) {
          parsed.forEach((location) => {
            // Ensure status is present for manual locations
            if (location.source === "MANUAL" && !location.status) {
              location.status = 5; // Set moored status
            }
            this.locations.set(location.mmsi, location);
          });

          const manualCount = parsed.filter(
            (loc) => loc.source === "MANUAL",
          ).length;
          const aisCount = parsed.filter((loc) => loc.source === "AIS").length;

          console.log(
            `${LOG_PREFIX} ✅ Loaded ${this.locations.size} stored locations:`,
          );
          console.log(`${LOG_PREFIX} Manual: ${manualCount}`);
          console.log(`${LOG_PREFIX} AIS: ${aisCount}`);
        } else {
          console.warn(
            `${LOG_PREFIX} Stored data is not an array, initializing empty locations`,
          );
          this.locations = new Map();
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error loading locations:`, error);
      this.locations = new Map();
    }
  }

  private async saveLocations(): Promise<void> {
    try {
      const locationArray = Array.from(this.locations.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locationArray));

      const manualCount = locationArray.filter(
        (loc) => loc.source === "MANUAL",
      ).length;
      const aisCount = locationArray.filter(
        (loc) => loc.source === "AIS",
      ).length;

      console.log(`${LOG_PREFIX} ✅ Saved ${locationArray.length} locations:`);
      console.log(`${LOG_PREFIX} Manual: ${manualCount}`);
      console.log(`${LOG_PREFIX} AIS: ${aisCount}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error saving locations:`, error);
    }
  }

  public async initializeFromCSV(csvLocations: YachtLocation[]): Promise<void> {
    console.log(
      `${LOG_PREFIX} Initializing ${csvLocations.length} manual locations from CSV`,
    );

    csvLocations.forEach((location) => {
      if (!location.timestamp) {
        console.warn(
          `${LOG_PREFIX} Missing timestamp for ${location.mmsi} in CSV`,
        );
        return;
      }

      const existingLocation = this.locations.get(location.mmsi);
      const csvLocation = {
        ...location,
        source: "MANUAL" as const,
        status: location.status || 5, // Ensure status is set
      };

      if (!existingLocation) {
        this.locations.set(location.mmsi, csvLocation);
        console.log(
          `${LOG_PREFIX} Added manual position for ${location.mmsi} from CSV (${location.timestamp})`,
        );
      } else if (existingLocation.source === "MANUAL") {
        const existingDate = new Date(existingLocation.timestamp);
        const newDate = new Date(location.timestamp);

        if (newDate > existingDate) {
          this.locations.set(location.mmsi, csvLocation);
          console.log(
            `${LOG_PREFIX} Updated manual position for ${location.mmsi} from CSV (${location.timestamp})`,
          );
        } else {
          console.log(
            `${LOG_PREFIX} Keeping existing manual position for ${location.mmsi} (${existingLocation.timestamp})`,
          );
        }
      } else {
        console.log(
          `${LOG_PREFIX} Keeping existing ${existingLocation.source} position for ${location.mmsi} (${existingLocation.timestamp})`,
        );
      }
    });

    await this.saveLocations();
  }

  public async updateLocation(
    mmsi: string,
    update: LocationUpdate,
  ): Promise<void> {
    if (!this.isValidCoordinate(update.lat, update.lon)) {
      console.warn(`${LOG_PREFIX} Invalid coordinates for ${mmsi}:`, update);
      return;
    }

    const currentLocation = this.locations.get(mmsi);

    // Never update if current position is MANUAL
    if (currentLocation?.source === "MANUAL") {
      console.log(
        `${LOG_PREFIX} Keeping manual position for ${mmsi} from ${currentLocation.timestamp}`,
      );
      return;
    }

    const newTimestamp = update.timestamp || new Date().toISOString();

    // Only update if no existing location or new AIS data is newer
    if (
      !currentLocation ||
      new Date(newTimestamp) > new Date(currentLocation.timestamp)
    ) {
      const newLocation: YachtLocation = {
        mmsi,
        lat: update.lat,
        lon: update.lon,
        speed: update.speed,
        course: update.course,
        status: update.status,
        timestamp: newTimestamp,
        source: "AIS",
      };

      this.locations.set(mmsi, newLocation);
      console.log(
        `${LOG_PREFIX} Updated AIS position for ${mmsi} (${newTimestamp})`,
      );

      await this.saveLocations();
    } else {
      const timeDiff = Math.round(
        (new Date(currentLocation.timestamp).getTime() -
          new Date(newTimestamp).getTime()) /
          (1000 * 60),
      );
      console.log(
        `${LOG_PREFIX} Keeping ${currentLocation.source} position for ${mmsi} (${timeDiff} minutes newer)`,
      );
    }
  }

  public getLocations(): YachtLocation[] {
    return Array.from(this.locations.values());
  }

  public getYachtLocation(mmsi: string): YachtLocation | undefined {
    return this.locations.get(mmsi);
  }

  private isValidCoordinate(lat: number, lon: number): boolean {
    return (
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }

  public getLocationStatistics(): {
    total: number;
    manual: number;
    ais: number;
    lastUpdate: string | null;
  } {
    const locations = Array.from(this.locations.values());
    const lastUpdate =
      locations.length > 0
        ? new Date(
            Math.max(...locations.map((l) => new Date(l.timestamp).getTime())),
          ).toISOString()
        : null;

    return {
      total: locations.length,
      manual: locations.filter((l) => l.source === "MANUAL").length,
      ais: locations.filter((l) => l.source === "AIS").length,
      lastUpdate,
    };
  }
}

export const locationService = new YachtLocationService();
export type { YachtLocation, LocationUpdate };
