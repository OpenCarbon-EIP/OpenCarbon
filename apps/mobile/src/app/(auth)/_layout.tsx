import { Redirect, Stack } from 'expo-router';
import { useAuthContext } from '@opencarbon/api/react';

// Groupe non authentifié. Si déjà connecté → redirige vers les onglets.
export default function AuthLayout() {
  const { status } = useAuthContext();

  if (status === 'authenticated') return <Redirect href="/(tabs)/dashboard" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
