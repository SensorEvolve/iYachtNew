// src/Types/yacht.ts

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
