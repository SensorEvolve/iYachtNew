import { Yacht } from './yacht';

export type RootStackParamList = {
  Home: undefined;
  Detail: {
    yacht: Yacht;
  };
  Search: undefined;
  Favorites: undefined;
};

export interface SelectedYacht {
  yachtId: string | null;
  position?: {
    lat: number;
    lon: number;
  };
}
