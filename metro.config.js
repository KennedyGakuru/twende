const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Get default Expo Metro config
const config = getDefaultConfig(__dirname);

// Create a mock for Node core modules
const createNodeMock = () => ({
  // Basic mock implementation
  Duplex: class Duplex {},
  Readable: class Readable {},
  Writable: class Writable {},
  Transform: class Transform {},
  PassThrough: class PassThrough {}
});

// Add only essential polyfills and mock the rest
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Only include absolutely necessary polyfills
  events: require.resolve('events'),
  // Mock other Node core modules
  stream: path.resolve(__dirname, 'mocks/stream.js'),
  crypto: path.resolve(__dirname, 'mocks/crypto.js'),
  http: path.resolve(__dirname, 'mocks/http.js'),
  https: path.resolve(__dirname, 'mocks/https.js'),
  os: path.resolve(__dirname, 'mocks/os.js'),
  path: path.resolve(__dirname, 'mocks/path.js'),
  vm: path.resolve(__dirname, 'mocks/vm.js'),
  ws: path.resolve(__dirname, 'mocks/ws.js'),
  _stream_duplex: path.resolve(__dirname, 'mocks/stream.js'),
  _stream_passthrough: path.resolve(__dirname, 'mocks/stream.js'),
  _stream_readable: path.resolve(__dirname, 'mocks/stream.js'),
  _stream_transform: path.resolve(__dirname, 'mocks/stream.js'),
  _stream_writable: path.resolve(__dirname, 'mocks/stream.js')
};

// Create mock files directory if it doesn't exist
try {
  require('fs').mkdirSync(path.join(__dirname, 'mocks'));
} catch (e) {}

// Create basic mock files
const mockFiles = {
  'stream.js': `module.exports = ${JSON.stringify(createNodeMock())}`,
  'crypto.js': 'module.exports = {}',
  'http.js': 'module.exports = {}',
  'https.js': 'module.exports = {}',
  'os.js': 'module.exports = {}',
  'path.js': 'module.exports = {}',
  'vm.js': 'module.exports = {}',
  'ws.js': 'module.exports = {}'
};

// Write mock files
Object.entries(mockFiles).forEach(([filename, content]) => {
  try {
    require('fs').writeFileSync(
      path.join(__dirname, 'mocks', filename),
      content
    );
  } catch (e) {}
});

// SVG support
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');

// Apply NativeWind last
module.exports = withNativeWind(config, { 
  input: './global.css',
  projectRoot: __dirname,
  watchFolders: [__dirname]
});