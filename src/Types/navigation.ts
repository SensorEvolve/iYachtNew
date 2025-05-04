// src/Types/NavigationParams.ts
import { Yacht } from "./yacht";

// Params for the screens within the Home stack
export type HomeStackParamList = {
  HomeRoot: undefined; // Renamed from 'Home' to avoid conflicts
  Detail: { yacht: Yacht };
  Map: { yachts: Yacht[] };
  Search: { yachts: Yacht[] };
};

// Params for the screens within the More stack
export type MoreStackParamList = {
  MoreList: undefined; // The initial menu screen
  About: undefined;
  Credits: undefined;
};

// Params for the Tabs themselves
// We pass props directly in this example, so might not need params here,
// but defining is good practice if you add params later.
export type RootTabParamList = {
  HomeTab: undefined;
  FavoritesTab: undefined;
  MoreTab: undefined;
};

// You might also need CompositeNavigationProp if navigating between Stack and Tab,
// but we'll keep it simple for now.
