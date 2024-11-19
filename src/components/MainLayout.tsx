import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetProps
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapScreen from '../screens/MapScreen';
import { useYachtSelection } from '../contexts/YachtSelectionContext';
import { Yacht } from '../Types/yacht';
import { RootStackParamList } from '../Types/navigation';

interface MainLayoutProps {
  yachts: Yacht[];
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ yachts, children }) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { selectedYacht, setSelectedYacht } = useYachtSelection();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const snapPoints = useMemo(() => {
    const minPoint = 25;
    const defaultPoint = 70;
    const maxPoint = Platform.OS === 'ios' ? 95 : 92;
    return [`${minPoint}%`, `${defaultPoint}%`, `${maxPoint}%`];
  }, []);

  const initialSnapPoint = useMemo(() => {
    if (route.name === 'Detail') return 2;
    return 1;
  }, [route.name]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === 2 && route.name !== 'Detail') {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, [route.name]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={2}
        opacity={0.5}
      />
    ),
    []
  );

  const handleYachtSelect = useCallback((yacht: Yacht) => {
    setSelectedYacht({
      yachtId: yacht.id,
    });
    if (route.name === 'Detail') {
      navigation.setParams({ yacht });
    }
  }, [navigation, route.name, setSelectedYacht]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.mapContainer}>
        <MapScreen
          yachts={yachts}
          onYachtSelect={handleYachtSelect}
          selectedYachtId={selectedYacht?.yachtId}
        />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        index={initialSnapPoint}
        handleIndicatorStyle={styles.handleIndicator}
        handleStyle={styles.handle}
        backgroundStyle={styles.bottomSheetBackground}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={false}
        topInset={insets.top}
      >
        {children}
      </BottomSheet>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flexGrow: 1,
  },
  handle: {
    paddingTop: 8,
    paddingBottom: 4,
  },
  handleIndicator: {
    backgroundColor: '#BDBDBD',
    width: 50,
    height: 4,
    borderRadius: 2,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 8,
  },
});

export default MainLayout;
