import { StyleSheet, Text, View } from 'react-native';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegister } from '@opencarbon/api/react';
import { RegisterSchema, type RegisterInput } from '@opencarbon/api';
import { Button } from '@/components/Button';
import { FormTextField } from '@/components/FormTextField';
import { useTheme } from '@/theme/useTheme';
import { PasswordRules } from './PasswordRules';
import { RoleToggle } from './RoleToggle';

// Saisie numérique optionnelle : champ vide → undefined, sinon le nombre tapé.
const parseCompanySize = (text: string) => {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : undefined;
};

export const RegisterForm = () => {
  const theme = useTheme();
  const register = useRegister();
  const { control, handleSubmit, setValue } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      role: 'CONSULTANT',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      professional_title: '',
    },
  });
  const role = useWatch({ control, name: 'role' });
  const password = useWatch({ control, name: 'password' });

  return (
    <View style={styles.form}>
      <RoleToggle value={role} onChange={(next) => setValue('role', next)} />
      <FormTextField
        control={control}
        name="email"
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <FormTextField control={control} name="password" label="Mot de passe" secureTextEntry />
      <PasswordRules password={password} />

      {role === 'CONSULTANT' ? (
        <>
          <FormTextField control={control} name="first_name" label="Prénom" />
          <FormTextField control={control} name="last_name" label="Nom" />
          <FormTextField control={control} name="professional_title" label="Titre professionnel" />
        </>
      ) : (
        <>
          <FormTextField control={control} name="company_name" label="Nom de l'entreprise" />
          <FormTextField
            control={control}
            name="company_size"
            label="Taille de l'entreprise (optionnel)"
            keyboardType="number-pad"
            parse={parseCompanySize}
          />
        </>
      )}

      {register.isError ? <Text style={{ color: theme.colors.danger }}>{register.error.message}</Text> : null}
      <Button
        label="Créer mon compte"
        onPress={handleSubmit((data) => register.mutate(data))}
        loading={register.isPending}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 12 },
});
