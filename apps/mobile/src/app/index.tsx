import { Redirect } from 'expo-router';
import { useAuthContext } from '@opencarbon/api/react';
import { SessionStatus } from '@/features/auth/SessionStatus';

// Point d'entrée : redirige selon l'état d'authentification.
// Tant que la session n'est pas confirmée (hydratation, serveur injoignable), on affiche
// SessionStatus pour éviter le flash de l'écran de login chez un utilisateur déjà connecté.
export default function Index() {
  const { status } = useAuthContext();

  if (status === 'authenticated') return <Redirect href="/(tabs)/dashboard" />;
  if (status === 'guest') return <Redirect href="/(auth)/login" />;
  return <SessionStatus />;
}
