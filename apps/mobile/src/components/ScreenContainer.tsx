import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

interface ScreenContainerProps {
  children: ReactNode;
  centered?: boolean;
  /** Contenu défilant qui remonte au-dessus du clavier — pour les écrans de formulaire. */
  scrollable?: boolean;
}

export const ScreenContainer = ({ children, centered = false, scrollable = false }: ScreenContainerProps) => {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      {scrollable ? (
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, centered && styles.centered]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.content, centered && styles.centered]}>{children}</View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 16 },
  scrollContent: { flexGrow: 1, padding: 16, gap: 16 },
  centered: { justifyContent: 'center' },
});
