import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import DetailScreen from "./src/screens/DetailScreen";
import SearchScreen from "./src/screens/SearchScreen";
import { Yacht } from "./src/Types/yacht";

export type RootStackParamList = {
  Home: undefined;
  Detail: { yacht: Yacht };
  Search: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const yachtData: Yacht[] = [
    {
      id: "1",
      name: "REV Ocean",
      builtBy: "VARD",
      yachtType: "Research Vessel",
      length: "182.9",
      topSpeed: "17.8",
      cruiseSpeed: "15",
      range: "21120",
      crew: "55",
      delivered: "2021",
      beam: "22",
      guests: "36",
      flag: "Norway",
      exteriorDesigner: "Espen Øino",
      interiorDesigner: "H2 Yacht Design",
      shortInfo: "REV Ocean is a research and expedition vessel built by VARD.",
      owner: "Kjell Inge Røkke",
      price: "$350 million",
      seizedBy: "",
      imageName: "rev_ocean",
    },
  ];

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          options={{
            title: "Super Yachts",
            headerStyle: {
              backgroundColor: "#ffff",
            },
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          {(props) => <HomeScreen {...props} yachts={yachtData} />}
        </Stack.Screen>
        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={({ route }) => ({
            title: route.params?.yacht.name || "Yacht Details",
          })}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: "Search Yachts" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
