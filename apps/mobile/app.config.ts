import type { ExpoConfig } from 'expo/config';

// Config Expo. Le baseUrl de l'API est exposé via `extra`, alimenté par la variable
// d'environnement EXPO_PUBLIC_API_BASE_URL — JAMAIS un fichier .env embarqué comme asset
// (défaut connu de l'ancien POC Flutter).
const config: ExpoConfig = {
  name: 'OpenCarbon',
  slug: 'opencarbon',
  scheme: 'opencarbon',
  version: '0.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router', 'expo-secure-store', 'expo-font', 'expo-splash-screen'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  },
};

export default config;
