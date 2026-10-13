import { StyleSheet, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLogin } from '@opencarbon/api/react';
import { LoginSchema, type LoginInput } from '@opencarbon/api';
import { Button } from '@/components/Button';
import { FormTextField } from '@/components/FormTextField';
import { useTheme } from '@/theme/useTheme';

export const LoginForm = () => {
  const theme = useTheme();
  const login = useLogin();
  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <View style={styles.form}>
      <FormTextField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <FormTextField control={control} name="password" label="Mot de passe" secureTextEntry />
      {login.isError ? <Text style={{ color: theme.colors.danger }}>{login.error.message}</Text> : null}
      <Button label="Se connecter" onPress={handleSubmit((data) => login.mutate(data))} loading={login.isPending} />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 12 },
});
