import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '../services/auth.service';
import type { AuthResponse, LoginInput, RegisterInput } from '../schemas/auth.schema';
import type { SafeUser } from '../schemas/user.schema';
import { useAuthContext } from './AuthProvider';
import { queryKeys } from './query-keys';

/** Connexion — gère pending/error via React Query, met à jour la session au succès. */
export const useLogin = () => {
  const { login } = useAuthContext();
  return useMutation<AuthResponse, Error, LoginInput>({ mutationFn: (input) => login(input) });
};

/** Inscription (consultant ou entreprise). */
export const useRegister = () => {
  const { register } = useAuthContext();
  return useMutation<AuthResponse, Error, RegisterInput>({ mutationFn: (input) => register(input) });
};

/** Déconnexion. */
export const useLogout = () => {
  const { logout } = useAuthContext();
  return useMutation<void, Error, void>({ mutationFn: () => logout() });
};

/**
 * Profil courant. Alimenté par la session ; `enabled` seulement si authentifié.
 * Utile pour rafraîchir /users/me à la demande.
 */
export const useMe = () => {
  const { client, status, user } = useAuthContext();
  return useQuery<SafeUser>({
    queryKey: queryKeys.me(),
    queryFn: () => authService.me(client),
    enabled: status === 'authenticated',
    initialData: user ?? undefined,
  });
};
