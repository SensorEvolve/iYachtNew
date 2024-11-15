import AsyncStorage from "@react-native-async-storage/async-storage";

interface YachtLocation {
  mmsi: string;
  lat: number;
  lon: number;
  timestamp: string;
  source: "CSV" | "AIS";
}

interface LocationUpdate {
  lat: number;
  lon: number;
  speed?: number;
  course?: number;
}

const STORAGE_KEY = "@yacht_locations";
const LOCATION_UPDATE_DEBOUNCE = 1000; // 1 second

class YachtLocationService {
  private locations: Map<string, YachtLocation> = new Map();
  private updateQueue: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadLocations();
  }

  // Initialize locations from AsyncStorage
  private async loadLocations(): Promise<void> {
    try {
      const storedLocations = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedLocations) {
        const parsed = JSON.parse(storedLocations) as YachtLocation[];
        parsed.forEach((location) => {
          this.locations.set(location.mmsi, location);
        });
        console.log("Loaded stored locations:", this.locations.size);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  }

  // Save locations to AsyncStorage
  private async saveLocations(): Promise<void> {
    try {
      const locationArray = Array.from(this.locations.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locationArray));
      console.log("Saved locations:", locationArray.length);
    } catch (error) {
      console.error("Error saving locations:", error);
    }
  }

  // Initialize with CSV data
  public async initializeFromCSV(csvLocations: YachtLocation[]): Promise<void> {
    console.log("Initializing locations from CSV:", csvLocations.length);
    csvLocations.forEach((location) => {
      // Only set if we don't have a newer location
      const existing = this.locations.get(location.mmsi);
      if (
        !existing ||
        new Date(existing.timestamp) < new Date(location.timestamp)
      ) {
        this.locations.set(location.mmsi, {
          ...location,
          source: "CSV",
        });
      }
    });
    await this.saveLocations();
  }

  // Update location from AIS
  public updateLocation(mmsi: string, update: LocationUpdate): void {
    // Clear any pending updates for this MMSI
    const existingTimeout = this.updateQueue.get(mmsi);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Create a new debounced update
    const timeout = setTimeout(async () => {
      const timestamp = new Date().toISOString();
      const newLocation: YachtLocation = {
        mmsi,
        lat: update.lat,
        lon: update.lon,
        timestamp,
        source: "AIS",
      };

      this.locations.set(mmsi, newLocation);
      await this.saveLocations();
      this.updateQueue.delete(mmsi);
    }, LOCATION_UPDATE_DEBOUNCE);

    this.updateQueue.set(mmsi, timeout);
  }

  // Get all locations
  public getLocations(): YachtLocation[] {
    return Array.from(this.locations.values());
  }

  // Get location for specific yacht
  public getYachtLocation(mmsi: string): YachtLocation | undefined {
    return this.locations.get(mmsi);
  }

  // Validate coordinates
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

  // Clear all stored locations
  public async clearLocations(): Promise<void> {
    this.locations.clear();
    this.updateQueue.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

export const locationService = new YachtLocationService();
export type { YachtLocation, LocationUpdate };
