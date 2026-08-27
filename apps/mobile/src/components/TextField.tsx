import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useTheme';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export const TextField = ({ label, error, style, ...rest }: TextFieldProps) => {
  const theme = useTheme();
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.primary }]}>{label}</Text>
      <TextInput
        placeholderTextColor={theme.colors.borderInput}
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.danger : theme.colors.borderInput,
            borderRadius: theme.radius.sm,
            color: theme.colors.buttonText,
          },
          style,
        ]}
        {...rest}
      />
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontFamily: 'Poppins', fontSize: 14 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: 'Poppins',
    fontSize: 16,
  },
  error: { fontFamily: 'Poppins', fontSize: 12 },
});
