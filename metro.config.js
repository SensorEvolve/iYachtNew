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
    assetExts: assetExts.filter((ext) => ext !== "svg").concat(["csv"]),
    sourceExts: [...sourceExts, "svg"],
  };

  return config;
})();
