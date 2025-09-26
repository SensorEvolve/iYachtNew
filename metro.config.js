const { getDefaultConfig } = require("expo/metro-config");
const { mergeConfig } = require("metro-config");

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

const config = {
  transformer: {
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== "svg").concat(["csv"]),
    sourceExts: [...sourceExts, "svg"],
  },
  server: {
    // Ensure WebSocket connections work properly in Metro
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        if (req.url?.startsWith("/websocket")) {
          res.setHeader("Access-Control-Allow-Origin", "*");
        }
        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
