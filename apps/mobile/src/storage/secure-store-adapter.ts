import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from '@opencarbon/api';

const ACCESS_KEY = 'oc_access_token';
const REFRESH_KEY = 'oc_refresh_token';

const isWeb = Platform.OS === 'web';

// Implémentation de TokenStorage via le Keychain (iOS) / Keystore (Android),
// avec fallback localStorage sur Web.
export const secureStoreAdapter: TokenStorage = {
  getAccessToken: async () => {
    if (isWeb) {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
    }
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  setAccessToken: async (token) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACCESS_KEY, token);
      }
      return;
    }
    return SecureStore.setItemAsync(ACCESS_KEY, token);
  },
  getRefreshToken: async () => {
    if (isWeb) {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null;
    }
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  setRefreshToken: async (token) => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(REFRESH_KEY, token);
      }
      return;
    }
    return SecureStore.setItemAsync(REFRESH_KEY, token);
  },
  clear: async () => {
    if (isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};

