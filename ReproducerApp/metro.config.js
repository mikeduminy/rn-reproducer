const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  server: {
    rewriteRequestUrl: url => {
      console.log('request', url);
      return url;
    },
  },
  transformer: {
    getTransformOptions: () => ({
      transform: {
        inlineRequires: true,
      },
    }),
  },
  // serializer: {
  //   getRunModuleStatement: moduleId =>
  //     // If we see this error, it means the module was fully parsed
  //     // If we see another error, it means the problem occurred during the bundle parsing
  //     `throw new Error("before module execution: ${JSON.stringify(
  //       moduleId,
  //     )}"); __r(${JSON.stringify(moduleId)});`,
  // },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
