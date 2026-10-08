import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLogin } from '@opencarbon/api/react';
import { LoginSchema } from '@opencarbon/api';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/useTheme';

export const LoginForm = () => {
  const theme = useTheme();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSubmit = () => {
    setFieldError(null);
    const parsed = LoginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Champs invalides');
      return;
    }
    login.mutate(parsed.data);
  };

  return (
    <View style={styles.form}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
      {fieldError ? <Text style={{ color: theme.colors.danger }}>{fieldError}</Text> : null}
      {login.isError ? <Text style={{ color: theme.colors.danger }}>{login.error.message}</Text> : null}
      <Button label="Se connecter" onPress={onSubmit} loading={login.isPending} />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 12 },
});
