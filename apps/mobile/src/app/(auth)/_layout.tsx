import { Redirect, Stack } from 'expo-router';
import { useAuthContext } from '@opencarbon/api/react';
import { SessionStatus } from '@/features/auth/SessionStatus';

// Groupe non authentifié. Session non confirmée → SessionStatus ; déjà connecté → onglets.
export default function AuthLayout() {
  const { status } = useAuthContext();

  if (status === 'authenticated') return <Redirect href="/(tabs)/dashboard" />;
  if (status !== 'guest') return <SessionStatus />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
