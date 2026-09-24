import { StyleSheet, Text, View } from 'react-native';
import { useAuthContext, useLogout } from '@opencarbon/api/react';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/useTheme';

export default function ProfileScreen() {
  const theme = useTheme();
  const { user } = useAuthContext();
  const logout = useLogout();

  const displayName =
    user?.consultant?.first_name ?? user?.company?.company_name ?? user?.email ?? 'Utilisateur';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.name, { color: theme.colors.primary }]}>{displayName}</Text>
        <Text style={{ color: theme.colors.onBackground, fontFamily: 'Poppins' }}>{user?.email}</Text>
        <Text style={{ color: theme.colors.tertiary, fontFamily: 'Poppins' }}>
          {user?.role === 'COMPANY' ? 'Entreprise' : 'Consultant'}
        </Text>
      </View>
      <View style={styles.spacer} />
      <Button
        label="Se déconnecter"
        variant="secondary"
        onPress={() => logout.mutate()}
        loading={logout.isPending}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { gap: 4 },
  name: { fontFamily: 'Anton', fontSize: 28 },
  spacer: { flex: 1 },
});
