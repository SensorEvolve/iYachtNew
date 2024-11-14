import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import { Yacht, CSV_COLUMNS } from "../Types/yacht";

export const loadYachtData = async (): Promise<Yacht[]> => {
  try {
    const csvModule = require("../assets/super_yachts.csv");
    const asset = Asset.fromModule(csvModule);
    await asset.downloadAsync();
    const csvContent = await FileSystem.readAsStringAsync(asset.localUri!);

    const lines = csvContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.includes("Name"));

    console.log(`Processing ${lines.length} yacht entries`);

    const yachts = lines.map((line, index) => {
      const values = line.split(";").map((v) => v.trim());

      return {
        id: String(index),
        name: values[CSV_COLUMNS.NAME] || "",
        builtBy: values[CSV_COLUMNS.BUILT_BY] || "",
        yachtType: values[CSV_COLUMNS.YACHT_TYPE] || "",
        length: values[CSV_COLUMNS.LENGTH] || "",
        topSpeed: values[CSV_COLUMNS.TOP_SPEED] || "",
        cruiseSpeed: values[CSV_COLUMNS.CRUISE_SPEED] || "",
        range: values[CSV_COLUMNS.RANGE] || "",
        crew: values[CSV_COLUMNS.CREW] || "",
        delivered: values[CSV_COLUMNS.DELIVERED] || "",
        beam: values[CSV_COLUMNS.BEAM] || "",
        guests: values[CSV_COLUMNS.GUESTS] || "",
        refit: values[CSV_COLUMNS.REFIT] || "",
        flag: values[CSV_COLUMNS.FLAG] || "",
        exteriorDesigner: values[CSV_COLUMNS.EXTERIOR_DESIGNER] || "",
        interiorDesigner: values[CSV_COLUMNS.INTERIOR_DESIGNER] || "",
        shortInfo: values[CSV_COLUMNS.SHORT_INFO] || "",
        owner: values[CSV_COLUMNS.OWNER] || "",
        price: values[CSV_COLUMNS.PRICE] || "",
        seizedBy: values[CSV_COLUMNS.SEIZED_BY] || "",
        imageName:
          values[CSV_COLUMNS.IMAGE_NAME] ||
          values[CSV_COLUMNS.NAME].toLowerCase().replace(/\s+/g, "_"),
        mmsi: values[CSV_COLUMNS.MMSI] || "",
        isFavorite: false,
      };
    });

    const yachtsWithMMSI = yachts.filter((y) => y.mmsi);
    console.log(
      `Found ${yachtsWithMMSI.length} yachts with MMSI numbers:`,
      yachtsWithMMSI.map((y) => ({ name: y.name, mmsi: y.mmsi })),
    );

    console.log(`Successfully loaded ${yachts.length} yachts`);
    return yachts;
  } catch (error) {
    console.error("Error loading yacht data:", error);
    throw error;
  }
};
