import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAuthContext, useLogout } from '@opencarbon/api/react';
import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme/useTheme';

/**
 * Écran affiché tant que la session stockée n'est pas confirmée :
 *  - `loading`     → spinner (évite le flash de l'écran de login)
 *  - `unreachable` → serveur injoignable, tokens conservés : réessayer ou changer de compte
 */
export const SessionStatus = () => {
  const theme = useTheme();
  const { status, retry } = useAuthContext();
  const logout = useLogout();

  if (status !== 'unreachable') {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScreenContainer centered>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Serveur injoignable</Text>
      <Text style={[styles.message, { color: theme.colors.onBackground }]}>
        Impossible de vérifier votre session. Vérifiez votre connexion puis réessayez.
      </Text>
      <Button label="Réessayer" onPress={retry} />
      <Button
        label="Utiliser un autre compte"
        variant="secondary"
        onPress={() => logout.mutate()}
        loading={logout.isPending}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Anton', fontSize: 28, textAlign: 'center' },
  message: { fontFamily: 'Poppins', fontSize: 16, textAlign: 'center' },
});
