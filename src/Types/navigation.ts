import { Yacht } from "./yacht";

export type RootStackParamList = {
  Home: undefined;
  Detail: { yacht: Yacht };
  Search: { yachts: Yacht[] };
  Favorites: { yachts: Yacht[] };
};
