import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Position {
  lat: number;
  lon: number;
}

interface SelectedYacht {
  yachtId: string | null;
  position?: Position;
}

interface YachtSelectionContextType {
  selectedYacht: SelectedYacht;
  setSelectedYacht: (yacht: SelectedYacht) => void;
}

const YachtSelectionContext = createContext<YachtSelectionContextType>({
  selectedYacht: { yachtId: null },
  setSelectedYacht: () => {},
});

export const YachtSelectionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedYacht, setSelectedYacht] = useState<SelectedYacht>({ yachtId: null });

  return (
    <YachtSelectionContext.Provider value={{ selectedYacht, setSelectedYacht }}>
      {children}
    </YachtSelectionContext.Provider>
  );
};

export const useYachtSelection = () => {
  const context = useContext(YachtSelectionContext);
  if (!context) {
    throw new Error('useYachtSelection must be used within a YachtSelectionProvider');
  }
  return context;
};
