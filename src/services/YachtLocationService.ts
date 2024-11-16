import AsyncStorage from "@react-native-async-storage/async-storage";
import { YachtLocation } from "../Types/yacht";

interface LocationUpdate {
  lat: number;
  lon: number;
  speed: number;
  course: number;
  status?: number;
}

interface YachtHistory {
  mmsi: string;
  currentLocation: YachtLocation;
  history: YachtLocation[];
}

const STORAGE_KEY = "@yacht_locations";
const HISTORY_KEY = "@yacht_history";
const DETAILED_INTERVAL = 10 * 60 * 1000; // 10 minutes
const HISTORICAL_RETENTION = 7 * 24 * 60 * 60 * 1000; // 7 days

class YachtLocationService {
  private locations: Map<string, YachtLocation> = new Map();
  private history: Map<string, YachtLocation[]> = new Map();

  constructor() {
    this.loadLocations();
    this.loadHistory();
    this.setupPeriodicCleanup();
  }

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

  private async loadHistory(): Promise<void> {
    try {
      const storedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        const parsed = JSON.parse(storedHistory) as Record<
          string,
          YachtLocation[]
        >;
        Object.entries(parsed).forEach(([mmsi, positions]) => {
          this.history.set(mmsi, positions);
        });
        console.log("Loaded history for yachts:", this.history.size);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    }
  }

  private async saveLocations(): Promise<void> {
    try {
      const locationArray = Array.from(this.locations.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(locationArray));
      console.log("Saved locations:", locationArray.length);
    } catch (error) {
      console.error("Error saving locations:", error);
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      const historyObject = Object.fromEntries(this.history);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(historyObject));
      console.log("Saved history for yachts:", this.history.size);
    } catch (error) {
      console.error("Error saving history:", error);
    }
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => this.cleanupOldData(), 60 * 60 * 1000); // Every hour
  }

  private cleanupOldData(): void {
    const now = Date.now();
    let changed = false;

    this.history.forEach((positions, mmsi) => {
      const filteredPositions = positions.filter((pos) => {
        const posTime = new Date(pos.timestamp).getTime();
        return now - posTime <= HISTORICAL_RETENTION;
      });

      if (filteredPositions.length !== positions.length) {
        changed = true;
        this.history.set(mmsi, filteredPositions);
      }
    });

    if (changed) {
      this.saveHistory();
    }
  }

  public async initializeFromCSV(csvLocations: YachtLocation[]): Promise<void> {
    console.log("Initializing locations from CSV:", csvLocations.length);
    csvLocations.forEach((location) => {
      this.locations.set(location.mmsi, {
        ...location,
        source: "MANUAL",
      });
    });
    await this.saveLocations();
  }

  private shouldStorePosition(
    lastUpdate: string | undefined,
    newTimestamp: string,
  ): boolean {
    if (!lastUpdate) return true;

    const lastTime = new Date(lastUpdate).getTime();
    const newTime = new Date(newTimestamp).getTime();
    return newTime - lastTime >= DETAILED_INTERVAL;
  }

  public async updateLocation(
    mmsi: string,
    update: LocationUpdate,
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const newLocation: YachtLocation = {
      mmsi,
      lat: update.lat,
      lon: update.lon,
      speed: update.speed,
      course: update.course,
      status: update.status,
      timestamp,
      source: "AIS",
    };

    // Update current location
    this.locations.set(mmsi, newLocation);
    await this.saveLocations();

    // Update history if enough time has passed
    const positions = this.history.get(mmsi) || [];
    const lastPosition = positions[positions.length - 1];

    if (this.shouldStorePosition(lastPosition?.timestamp, timestamp)) {
      positions.push(newLocation);
      this.history.set(mmsi, positions);
      await this.saveHistory();
    }
  }

  public getLocations(): YachtLocation[] {
    return Array.from(this.locations.values());
  }

  public getYachtLocation(mmsi: string): YachtLocation | undefined {
    return this.locations.get(mmsi);
  }

  public getYachtHistory(mmsi: string): YachtLocation[] {
    return this.history.get(mmsi) || [];
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
}

export const locationService = new YachtLocationService();
export type { YachtLocation, LocationUpdate };
