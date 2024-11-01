// scripts/convertCsvToJson.js
const fs = require("fs");
const csv = require("csv-parse");
const path = require("path");

// Input and output paths
const inputFile = path.join(__dirname, "../data/super_yachts.csv");
const outputFile = path.join(__dirname, "../assets/yachtData.json");

// Create readable stream
const processFile = async () => {
  const records = [];
  const parser = fs.createReadStream(inputFile).pipe(
    csv.parse({
      columns: true,
      skip_empty_lines: true,
    }),
  );

  for await (const record of parser) {
    // Process each row using our structure
    const processedYacht = {
      id: `yacht_${records.length + 1}`,
      name: record.Name || "",
      builtBy: record["Built By"] || undefined,
      yachtType: record["Yacht Type"] || undefined,

      specifications: {
        length: record.Length ? `${record.Length}m` : undefined,
        topSpeed: record["Top Speed"]
          ? `${record["Top Speed"]} knots`
          : undefined,
        cruiseSpeed: record["Cruise Speed"]
          ? `${record["Cruise Speed"]} knots`
          : undefined,
        range: record.Range ? `${record.Range}nm` : undefined,
        crew: record.Crew ? parseInt(record.Crew) : undefined,
        guests: record.Guests ? parseInt(record.Guests) : undefined,
        beam: record.Beam ? `${record.Beam}m` : undefined,
      },

      dates: {
        delivered: record.Delivered || undefined,
        refit: record.Refit || undefined,
      },

      details: {
        flag: record.Flag || undefined,
        exteriorDesigner: record["Exterior Designer"] || undefined,
        interiorDesigner: record["Interior Designer"] || undefined,
        shortInfo: record["Short Info"] || undefined,
      },

      // Image connection
      imageName: record.imageName || "",

      // Optional fields
      owner: record.Owner || undefined,
      price: record.Price || undefined,
      seizedBy: record["Seized By"] || undefined,
    };

    // Remove undefined values for cleaner JSON
    const cleanYacht = JSON.parse(JSON.stringify(processedYacht));
    records.push(cleanYacht);
  }

  // Write the JSON file
  fs.writeFileSync(outputFile, JSON.stringify({ yachts: records }, null, 2));

  console.log(`Converted ${records.length} yachts to JSON`);
};

processFile().catch(console.error);
