import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

interface ScreenContainerProps {
  children: ReactNode;
  centered?: boolean;
}

export const ScreenContainer = ({ children, centered = false }: ScreenContainerProps) => {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.content, centered && styles.centered]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, padding: 16, gap: 16 },
  centered: { justifyContent: 'center' },
});
