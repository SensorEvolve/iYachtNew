// src/Types/NavigationParams.ts
import { Yacht } from "./yacht"; // Ensure path is correct

// Params for the screens within the Home stack
export type HomeStackParamList = {
  HomeRoot: undefined; // The screen rendering HomeScreen component
  Detail: { yacht: Yacht };
  // Map: { yachts: Yacht[] }; // REMOVED - Map is now a separate Tab
  Search: { yachts: Yacht[] }; // Search screen still part of this stack
};

// Params for the screens within the More stack
export type MoreStackParamList = {
  MoreList: undefined; // The initial menu screen
  About: undefined;
  Credits: undefined;
  // Add other screens reachable from More stack here
};

// Params for the Tabs themselves
export type RootTabParamList = {
  HomeTab: undefined; // Points to HomeStackNavigator
  FavoritesTab: undefined; // Points to FavoritesScreen (receives props via render prop)
  MapTab: undefined; // << ADDED - Points to MapScreen (receives props via render prop)
  MoreTab: undefined; // Points to MoreStackNavigator
};

// You might also need CompositeNavigationProp if navigating between Stack and Tab,
// but we'll keep it simple for now.
