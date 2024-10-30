const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add CSV files to the asset patterns
  config.resolver.assetExts.push("csv");

  // Handle CSV files as assets
  config.transformer.assetPlugins.push("expo-asset/tools/hashAssetFiles");

  return config;
})();
