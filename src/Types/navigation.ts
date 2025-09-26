import { Yacht } from "./yacht";

// Params for the screens within the Home stack
export type HomeStackParamList = {
  HomeRoot: undefined;
  Detail: { yacht: Yacht };
  Search: { yachts: Yacht[] };
};

// Params for the screens within the More stack
export type MoreStackParamList = {
  MoreList: undefined;
  About: undefined;
  Credits: undefined;
};

// Params for the Tabs themselves
export type RootTabParamList = {
  HomeTab: undefined;
  FavoritesTab: undefined;
  MapTab: { focusedMmsi?: string } | undefined; // Allow both with and without params
  MoreTab: undefined;
};
