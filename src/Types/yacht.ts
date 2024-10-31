// Define CSV column structure
export const CSV_COLUMNS = {
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
} as const;

export interface Yacht {
  // Preserve id as it's used in the application
  id: string;
  // Fields in new CSV order
  name: string;
  builtBy: string;
  yachtType: string;
  length: string;
  topSpeed: string;
  cruiseSpeed: string;
  range: string;
  crew: string;
  delivered: string;
  beam: string;
  guests: string;
  refit?: string;
  flag: string;
  exteriorDesigner: string;
  interiorDesigner: string;
  shortInfo: string;
  owner: string;
  price: string;
  seizedBy: string;
  imageName: string;
}

// Preserve existing filter interface
export interface YachtFilters {
  lengthMin?: number;
  lengthMax?: number;
  yearMin?: number;
  yearMax?: number;
  builder?: string;
  yachtType?: string;
}

// Preserve existing sort types
export type SortOption = "length" | "year" | "name" | "builder";
export type SortDirection = "asc" | "desc";

// Add new type for raw CSV data
export type RawYachtData = Omit<Yacht, "id">;
