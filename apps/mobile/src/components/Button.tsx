import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}

export const Button = ({ label, variant = 'primary', loading = false, disabled, style, ...rest }: ButtonProps) => {
  const theme = useTheme();
  const bg = variant === 'primary' ? theme.colors.primary : theme.colors.secondary;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        { backgroundColor: bg, borderRadius: theme.radius.md, opacity: isDisabled || state.pressed ? 0.7 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.text} />
      ) : (
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Poppins',
    fontSize: 16,
    fontWeight: '600',
  },
});
