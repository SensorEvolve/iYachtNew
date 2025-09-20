import AsyncStorage from "@react-native-async-storage/async-storage";
import { YachtLocation } from "../types/yacht";

type StoredLocationMap = { [mmsi: string]: YachtLocation };

const STORAGE_KEY = "@yacht_locations";
const LOG_PREFIX = "🛥️ [LocationService]";

class YachtLocationService {
  private locations: Map<string, YachtLocation> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    console.log(`${LOG_PREFIX} Service created`);
  }

  // This is the main loading function for App.tsx to call
  public async loadStoredLocations(): Promise<StoredLocationMap> {
    try {
      console.log(`${LOG_PREFIX} Loading stored locations`);
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (!storedData) {
        console.log(`${LOG_PREFIX} No stored locations found.`);
        return {};
      }

      const parsed = JSON.parse(storedData);
      const locationMap: StoredLocationMap = {};

      if (Array.isArray(parsed)) {
        parsed.forEach((location: YachtLocation) => {
          if (location.mmsi) {
            this.locations.set(location.mmsi, location);
            locationMap[location.mmsi] = location;
          }
        });
      }

      const count = Object.keys(locationMap).length;
      console.log(`${LOG_PREFIX} ✅ Loaded ${count} stored locations.`);
      return locationMap;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error loading locations:`, error);
      return {}; // Return empty object on error
    }
  }

  // Simplified save method for live updates from App.tsx
  public saveLocation(
    mmsi: string,
    locationData: YachtLocation,
    source: "AIS" | "MANUAL"
  ): void {
    if (!this.isValidCoordinate(locationData.lat, locationData.lon)) {
      console.warn(
        `${LOG_PREFIX} Invalid coordinates for ${mmsi}, not saving.`
      );
      return;
    }

    const newLocation: YachtLocation = {
      ...locationData,
      mmsi,
      source,
    };

    this.locations.set(mmsi, newLocation);
    this.debouncedSaveLocations(); // Use debouncing to avoid excessive writes
  }

  private async saveLocationsToStorage(): Promise<void> {
    try {
      const locationArray = Array.from(this.locations.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locationArray));
      console.log(
        `${LOG_PREFIX} ✅ Saved ${locationArray.length} locations to storage.`
      );
    } catch (error) {
      console.error(`${LOG_PREFIX} Error saving locations:`, error);
    }
  }

  private debouncedSaveLocations(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveLocationsToStorage(), 1500);
  }

  private isValidCoordinate(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  // The complex initializeFromCSV method is now removed.
}

export const locationService = new YachtLocationService();
