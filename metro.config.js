const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  // Modify resolver for SVG support
  const { assetExts, sourceExts } = config.resolver;
  config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
    assetPlugins: [
      ...config.transformer.assetPlugins,
      "expo-asset/tools/hashAssetFiles",
    ],
  };
  config.resolver = {
    ...config.resolver,
    // Only change here is adding png to the array while keeping everything else the same
    assetExts: assetExts.filter((ext) => ext !== "svg").concat(["csv", "png"]),
    sourceExts: [...sourceExts, "svg"],
  };
  return config;
})();
