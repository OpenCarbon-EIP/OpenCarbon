import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@opencarbon/api/react';
import { useFonts, Anton_400Regular } from '@expo-google-fonts/anton';
import { Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { env } from '@/config/env';
import { queryClient } from '@/lib/queryClient';
import { secureStoreAdapter } from '@/storage/secure-store-adapter';
import { useTheme } from '@/theme/useTheme';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const theme = useTheme();
  // Thème du navigateur (fond des transitions, barre d'onglets) aligné sur nos tokens.
  const navigationTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.background,
        text: theme.colors.onBackground,
        border: theme.colors.borderInput,
      },
    };
  }, [scheme, theme]);
  const [fontsLoaded, fontError] = useFonts({
    Anton: Anton_400Regular,
    Poppins: Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider baseUrl={env.apiBaseUrl} storage={secureStoreAdapter}>
            <StatusBar style="auto" />
            <Slot />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
