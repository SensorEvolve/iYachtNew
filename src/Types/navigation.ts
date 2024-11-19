import { Yacht } from './yacht';

export type RootStackParamList = {
  Home: undefined;
  Map: undefined;
  Detail: { yacht: Yacht };
  Search: undefined;
  Favorites: undefined;
};

export type NavigationProps = {
  navigation: {
    navigate: (screen: keyof RootStackParamList, params?: any) => void;
    goBack: () => void;
  };
};
