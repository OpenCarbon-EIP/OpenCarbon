import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@opencarbon/api';

const ACCESS_KEY = 'oc_access_token';
const REFRESH_KEY = 'oc_refresh_token';

// Implémentation de TokenStorage via le Keychain (iOS) / Keystore (Android).
// Le refresh_token est persisté ici car le natif n'a pas de cookie jar.
export const secureStoreAdapter: TokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  setAccessToken: (token) => SecureStore.setItemAsync(ACCESS_KEY, token),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  setRefreshToken: (token) => SecureStore.setItemAsync(REFRESH_KEY, token),
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
