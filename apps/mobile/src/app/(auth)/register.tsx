import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { useTheme } from '@/theme/useTheme';

export default function RegisterScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: theme.colors.primary }]}>Créer un compte</Text>
        <RegisterForm />
        <View style={styles.footer}>
          <Text style={{ color: theme.colors.buttonText, fontFamily: 'Poppins' }}>Déjà inscrit ? </Text>
          <Link href="/(auth)/login" style={{ color: theme.colors.primary, fontFamily: 'Poppins-SemiBold' }}>
            Se connecter
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 16 },
  title: { fontFamily: 'Anton', fontSize: 32, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
});
