const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Fewer parallel workers = less peak RAM (avoids OOM on low-memory PCs).
config.maxWorkers = 2;

module.exports = config;
