import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { ScreenContainer } from '@/components/ScreenContainer';
import { LoginForm } from '@/features/auth/LoginForm';
import { useTheme } from '@/theme/useTheme';

export default function LoginScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer centered>
      <Text style={[styles.title, { color: theme.colors.primary }]}>OpenCarbon</Text>
      <LoginForm />
      <View style={styles.footer}>
        <Text style={{ color: theme.colors.buttonText, fontFamily: 'Poppins' }}>Pas encore de compte ? </Text>
        <Link href="/(auth)/register" style={{ color: theme.colors.primary, fontFamily: 'Poppins-SemiBold' }}>
          Créer un compte
        </Link>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Anton', fontSize: 40, textAlign: 'center', marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
