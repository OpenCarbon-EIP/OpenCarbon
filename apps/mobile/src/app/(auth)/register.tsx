import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { useTheme } from '@/theme/useTheme';

export default function RegisterScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer scrollable>
      <Text style={[styles.title, { color: theme.colors.primary }]}>Créer un compte</Text>
      <RegisterForm />
      <View style={styles.footer}>
        <Text style={{ color: theme.colors.onBackground, fontFamily: 'Poppins' }}>Déjà inscrit ? </Text>
        <Link href="/(auth)/login" style={{ color: theme.colors.primary, fontFamily: 'Poppins-SemiBold' }}>
          Se connecter
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Anton', fontSize: 32, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
