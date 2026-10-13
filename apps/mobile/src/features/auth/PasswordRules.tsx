import { StyleSheet, Text, View } from 'react-native';
import { PASSWORD_RULES } from '@opencarbon/api';
import { useTheme } from '@/theme/useTheme';

/** Règles du mot de passe (@IsStrongPassword backend), cochées au fil de la saisie. */
export const PasswordRules = ({ password }: { password: string }) => {
  const theme = useTheme();
  return (
    <View style={styles.list} accessibilityRole="summary">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <Text
            key={rule.label}
            style={[styles.rule, { color: ok ? theme.colors.primary : theme.colors.muted }]}
            accessibilityLabel={`${rule.label} : ${ok ? 'respecté' : 'non respecté'}`}
          >
            {ok ? '✓' : '•'} {rule.label}
          </Text>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: 2 },
  rule: { fontFamily: 'Poppins', fontSize: 12 },
});
