// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { mergeConfig } = require("metro-config");

// Get the default Metro configuration
const defaultConfig = getDefaultConfig(__dirname);

// Destructure for easier access
const { assetExts, sourceExts } = defaultConfig.resolver;

// Configure react-native-svg-transformer
const svgTransformerConfig = {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    // Keep existing assetExts, filter out 'svg', add 'csv'
    assetExts: assetExts.filter((ext) => ext !== "svg").concat(["csv"]),
    // Keep existing sourceExts, add 'svg'
    sourceExts: [...sourceExts, "svg"],
  },
};

// Merge the default config with the SVG transformer config
module.exports = mergeConfig(defaultConfig, svgTransformerConfig);
