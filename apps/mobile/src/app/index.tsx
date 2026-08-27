import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthContext } from '@opencarbon/api/react';
import { useTheme } from '@/theme/useTheme';

// Point d'entrée : redirige selon l'état d'authentification.
// Tant que la session s'hydrate (lecture SecureStore async), on affiche un loader
// pour éviter le flash de l'écran de login chez un utilisateur déjà connecté.
export default function Index() {
  const { status } = useAuthContext();
  const theme = useTheme();

  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <Redirect href={status === 'authenticated' ? '/(tabs)/dashboard' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
