import { useColorScheme } from 'react-native';
import { themes, type Theme } from '@opencarbon/tokens';

/** Renvoie le thème (light/dark) selon le réglage système. */
export const useTheme = (): Theme => {
  const scheme = useColorScheme();
  return themes[scheme === 'dark' ? 'dark' : 'light'];
};
