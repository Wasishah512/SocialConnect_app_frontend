// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add any custom settings if needed
config.resolver.assetExts.push('cjs');

module.exports = config;