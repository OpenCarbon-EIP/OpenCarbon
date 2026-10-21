// Config Metro pour un monorepo pnpm (node_modules hoisté via .npmrc) + transformer SVG.
// watchFolders : Metro surveille la racine pour résoudre packages/*.
// nodeModulesPaths : cherche dans le node_modules de l'app puis celui de la racine.
// On garde la recherche hiérarchique active pour résoudre les deps transitives d'Expo.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// --- Monorepo ---
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// --- SVG en composants React ---
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
