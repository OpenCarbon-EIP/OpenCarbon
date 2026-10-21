// Étend la config racine. Les règles strictes (imports, type-imports, prettier)
// sont définies une seule fois à la racine.
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    // Fichiers de config CommonJS (Node) et artefacts générés : hors lint TS/ESM.
    ignores: ['.expo/**', 'expo-env.d.ts', 'metro.config.js', 'babel.config.js', 'eslint.config.mjs'],
  },
];
