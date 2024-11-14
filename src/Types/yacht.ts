export interface Yacht {
  id: string;
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
  isFavorite?: boolean;
  mmsi: string;
}

export interface YachtFilters {
  lengthMin?: number;
  lengthMax?: number;
  yearMin?: number;
  yearMax?: number;
  builder?: string;
  yachtType?: string;
}

export type SortOption = "length" | "year" | "name" | "builder";
export type SortDirection = "asc" | "desc";

export enum CSV_COLUMNS {
  NAME = 0,
  BUILT_BY = 1,
  YACHT_TYPE = 2,
  LENGTH = 3,
  TOP_SPEED = 4,
  CRUISE_SPEED = 5,
  RANGE = 6,
  CREW = 7,
  DELIVERED = 8,
  BEAM = 9,
  GUESTS = 10,
  REFIT = 11,
  FLAG = 12,
  EXTERIOR_DESIGNER = 13,
  INTERIOR_DESIGNER = 14,
  SHORT_INFO = 15,
  OWNER = 16,
  PRICE = 17,
  SEIZED_BY = 18,
  IMAGE_NAME = 19,
  MMSI = 20,
}

export interface FavoriteState {
  favorites: string[];
}

export type FavoriteAction =
  | { type: "ADD_FAVORITE"; id: string }
  | { type: "REMOVE_FAVORITE"; id: string }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "SET_FAVORITES"; favorites: string[] };
