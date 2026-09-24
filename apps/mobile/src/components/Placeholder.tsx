import { StyleSheet, Text } from 'react-native';
import { ScreenContainer } from '@/components/ScreenContainer';
import { useTheme } from '@/theme/useTheme';

// Écran "à venir" pour les onglets non encore implémentés (dashboard, offers, messages).
export const Placeholder = ({ title }: { title: string }) => {
  const theme = useTheme();
  return (
    <ScreenContainer centered>
      <Text style={[styles.title, { color: theme.colors.primary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.colors.onBackground }]}>Bientôt disponible</Text>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  title: { fontFamily: 'Anton', fontSize: 32, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins', fontSize: 16, textAlign: 'center' },
});
