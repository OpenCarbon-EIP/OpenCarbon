import Constants from 'expo-constants';
import { EnvironmentFailure } from '@opencarbon/api';

// Lit apiBaseUrl depuis app.config.ts (extra), lui-même alimenté par EXPO_PUBLIC_API_BASE_URL.
// Validé au démarrage : on échoue vite et clairement plutôt que sur un fetch mystérieux.
const apiBaseUrl = (Constants.expoConfig?.extra?.apiBaseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL) as
  | string
  | undefined;

if (!apiBaseUrl) {
  throw new EnvironmentFailure(
    'EXPO_PUBLIC_API_BASE_URL est manquant. Copiez apps/mobile/.env.example en .env et renseignez-le.',
  );
}

export const env = {
  apiBaseUrl,
} as const;
