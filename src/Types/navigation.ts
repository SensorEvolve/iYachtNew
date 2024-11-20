// src/Types/navigation.ts
import { Yacht } from "./yacht";

export type RootStackParamList = {
  Home: undefined;
  Detail: { yacht: Yacht };
  Search: { yachts: Yacht[] };
  Favorites: { yachts: Yacht[] };
  Map: { yachts: Yacht[] }; // Changed from yachtsId since we pass the full yachts array
};
