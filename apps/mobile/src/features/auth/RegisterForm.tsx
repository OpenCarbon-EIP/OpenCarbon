import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRegister } from '@opencarbon/api/react';
import { RegisterSchema, type RegisterInput, type Role } from '@opencarbon/api';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useTheme } from '@/theme/useTheme';
import { RoleToggle } from './RoleToggle';

export const RegisterForm = () => {
  const theme = useTheme();
  const register = useRegister();

  const [role, setRole] = useState<Role>('CONSULTANT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Consultant
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [professionalTitle, setProfessionalTitle] = useState('');
  // Company
  const [companyName, setCompanyName] = useState('');
  const [companySize, setCompanySize] = useState('');

  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSubmit = () => {
    setFieldError(null);
    const payload: RegisterInput =
      role === 'CONSULTANT'
        ? { role, email, password, first_name: firstName, last_name: lastName, professional_title: professionalTitle }
        : {
            role,
            email,
            password,
            company_name: companyName,
            ...(companySize ? { company_size: Number(companySize) } : {}),
          };

    const parsed = RegisterSchema.safeParse(payload);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Champs invalides');
      return;
    }
    register.mutate(parsed.data);
  };

  return (
    <View style={styles.form}>
      <RoleToggle value={role} onChange={setRole} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />

      {role === 'CONSULTANT' ? (
        <>
          <TextField label="Prénom" value={firstName} onChangeText={setFirstName} />
          <TextField label="Nom" value={lastName} onChangeText={setLastName} />
          <TextField label="Titre professionnel" value={professionalTitle} onChangeText={setProfessionalTitle} />
        </>
      ) : (
        <>
          <TextField label="Nom de l'entreprise" value={companyName} onChangeText={setCompanyName} />
          <TextField
            label="Taille de l'entreprise (optionnel)"
            value={companySize}
            onChangeText={setCompanySize}
            keyboardType="number-pad"
          />
        </>
      )}

      {fieldError ? <Text style={{ color: theme.colors.danger }}>{fieldError}</Text> : null}
      {register.isError ? <Text style={{ color: theme.colors.danger }}>{register.error.message}</Text> : null}
      <Button label="Créer mon compte" onPress={onSubmit} loading={register.isPending} />
    </View>
  );
};

const styles = StyleSheet.create({
  form: { gap: 12 },
});
