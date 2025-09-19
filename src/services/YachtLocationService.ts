import AsyncStorage from "@react-native-async-storage/async-storage";
import { YachtLocation } from "../types/yacht";

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
  private saveTimeout: NodeJS.Timeout | null = null; // For debouncing

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
        if (Array.isArray(parsed)) {
          parsed.forEach((location) => {
            if (location.source === "MANUAL" && !location.status) {
              location.status = 5; // Set moored status
            }
            this.locations.set(location.mmsi, location);
          });

          const stats = this.getLocationStatistics();
          console.log(
            `${LOG_PREFIX} ✅ Loaded ${stats.total} stored locations:`
          );
          console.log(`${LOG_PREFIX} Manual: ${stats.manual}`);
          console.log(`${LOG_PREFIX} AIS: ${stats.ais}`);
        } else {
          console.warn(`${LOG_PREFIX} Invalid stored data format`);
          this.locations = new Map();
        }
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error loading locations:`, error);
      this.locations = new Map();
    }
  }

  public async initializeFromCSV(csvLocations: YachtLocation[]): Promise<void> {
    console.log(
      `${LOG_PREFIX} Processing ${csvLocations.length} manual locations from CSV`
    );

    for (const location of csvLocations) {
      if (!this.isValidCoordinate(location.lat, location.lon)) {
        console.warn(
          `${LOG_PREFIX} Invalid coordinates for ${location.mmsi} in CSV`
        );
        continue;
      }

      const existingLocation = this.locations.get(location.mmsi);
      const csvLocation = {
        ...location,
        source: "MANUAL" as const,
        status: location.status || 5,
      };

      if (!existingLocation) {
        this.locations.set(location.mmsi, csvLocation);
        console.log(`${LOG_PREFIX} Added manual position for ${location.mmsi}`);
      } else if (existingLocation.source === "MANUAL") {
        const existingDate = new Date(existingLocation.timestamp);
        const newDate = new Date(location.timestamp);

        if (newDate > existingDate) {
          this.locations.set(location.mmsi, csvLocation);
          console.log(
            `${LOG_PREFIX} Updated manual position for ${location.mmsi}`
          );
        } else {
          console.log(
            `${LOG_PREFIX} Keeping existing manual position for ${location.mmsi}`
          );
        }
      } else {
        console.log(
          `${LOG_PREFIX} Keeping existing AIS position for ${location.mmsi}`
        );
      }
    }

    // Use the debounced save instead of saving immediately
    this.debouncedSaveLocations();
  }

  public async updateLocation(
    mmsi: string,
    update: LocationUpdate
  ): Promise<void> {
    if (!this.isValidCoordinate(update.lat, update.lon)) {
      console.warn(`${LOG_PREFIX} Invalid coordinates for ${mmsi}:`, update);
      return;
    }

    const currentLocation = this.locations.get(mmsi);
    const newTimestamp = update.timestamp || new Date().toISOString();

    if (currentLocation?.source === "MANUAL") {
      const currentDate = new Date(currentLocation.timestamp);
      const newDate = new Date(newTimestamp);

      if (newDate > currentDate) {
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
          `${LOG_PREFIX} Updated AIS position for previously manual ${mmsi}`
        );
        this.debouncedSaveLocations(); // Use the debounced save
      } else {
        console.log(`${LOG_PREFIX} Keeping manual position for ${mmsi}`);
      }
      return;
    }

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
    // Use the debounced save instead of saving immediately
    this.debouncedSaveLocations();
  }

  private async saveLocations(): Promise<void> {
    try {
      const locationArray = Array.from(this.locations.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locationArray));

      const stats = this.getLocationStatistics();
      console.log(`${LOG_PREFIX} ✅ Saved ${stats.total} locations:`);
      console.log(`${LOG_PREFIX} Manual: ${stats.manual}`);
      console.log(`${LOG_PREFIX} AIS: ${stats.ais}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error saving locations:`, error);
    }
  }

  // New method to debounce the save operation
  private debouncedSaveLocations(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveLocations();
    }, 1500); // Wait 1.5 seconds after the last update before saving
  }

  private isValidCoordinate(lat: number, lon: number): boolean {
    return (
      typeof lat === "number" &&
      typeof lon === "number" &&
      !isNaN(lat) &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  }

  public getLocations(): YachtLocation[] {
    return Array.from(this.locations.values());
  }

  public getYachtLocation(mmsi: string): YachtLocation | undefined {
    return this.locations.get(mmsi);
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
            Math.max(...locations.map((l) => new Date(l.timestamp).getTime()))
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
