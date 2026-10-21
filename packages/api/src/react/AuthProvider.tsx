import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createApiConfig } from '../config/env';
import { AuthFailure } from '../http/errors';
import { HttpClient } from '../http/http-client';
import type { TokenStorage } from '../storage/token-storage';
import { authService } from '../services/auth.service';
import type { AuthResponse, LoginInput, RegisterInput } from '../schemas/auth.schema';
import type { SafeUser } from '../schemas/user.schema';
import { queryKeys } from './query-keys';

/**
 * - `unreachable` : une session est stockée mais le serveur n'a pas pu la confirmer
 *   (réseau coupé, 5xx). Les tokens sont conservés ; l'app propose `retry()`.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'guest' | 'unreachable';

export interface AuthContextValue {
  status: AuthStatus;
  user: SafeUser | null;
  /** Client HTTP authentifié à réutiliser pour les autres features. */
  client: HttpClient;
  login: (input: LoginInput) => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  /** Relance l'hydratation de la session (après un statut `unreachable`). */
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  /** URL de base de l'API (injectée par l'app hôte). */
  baseUrl: string;
  /** Implémentation de stockage des tokens (expo-secure-store côté mobile). */
  storage: TokenStorage;
  children: ReactNode;
}

export const AuthProvider = ({ baseUrl, storage, children }: AuthProviderProps) => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<SafeUser | null>(null);
  const [hydrationAttempt, setHydrationAttempt] = useState(0);
  // Incrémenté à chaque action de session (login, register, logout) : une hydratation
  // lancée avant devient périmée et ne doit plus toucher à l'état ni au stockage.
  const sessionVersion = useRef(0);

  // Ref pour que le callback onLogout du client pointe toujours vers le dernier setter.
  const resetSession = useRef<() => void>(() => undefined);

  const client = useMemo(
    () =>
      new HttpClient({
        config: createApiConfig({ baseUrl }),
        storage,
        onLogout: () => resetSession.current(),
      }),
    [baseUrl, storage],
  );

  resetSession.current = () => {
    setUser(null);
    setStatus('guest');
    queryClient.removeQueries({ queryKey: queryKeys.me() });
  };

  const applySession = async (auth: AuthResponse): Promise<AuthResponse> => {
    sessionVersion.current += 1;
    await storage.setAccessToken(auth.access_token);
    await storage.setRefreshToken(auth.refresh_token);
    setUser(auth.user);
    setStatus('authenticated');
    queryClient.setQueryData(queryKeys.me(), auth.user);
    return auth;
  };

  // Hydratation au démarrage : si un access token existe, on tente /users/me.
  useEffect(() => {
    let cancelled = false;
    const version = sessionVersion.current;
    const isStale = () => cancelled || version !== sessionVersion.current;

    void (async () => {
      const token = await storage.getAccessToken();
      if (isStale()) return;
      if (!token) {
        setStatus('guest');
        return;
      }
      setStatus('loading');
      try {
        const me = await authService.me(client);
        if (isStale()) return;
        setUser(me);
        setStatus('authenticated');
      } catch (error) {
        if (isStale()) return;
        if (error instanceof AuthFailure) {
          // Session invalidée par le backend : on purge.
          await storage.clear();
          setStatus('guest');
        } else {
          // Panne passagère : on garde les tokens pour pouvoir réessayer.
          setStatus('unreachable');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, storage, hydrationAttempt]);

  const retry = useCallback(() => setHydrationAttempt((n) => n + 1), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      client,
      login: async (input) => applySession(await authService.login(client, input)),
      register: async (input) => applySession(await authService.register(client, input)),
      logout: async () => {
        sessionVersion.current += 1;
        const refresh = await storage.getRefreshToken();
        try {
          await authService.logout(client, refresh);
        } finally {
          await storage.clear();
          resetSession.current();
        }
      },
      retry,
    }),
    // applySession/resetSession sont stables via client/storage.
    [status, user, client, storage, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext doit être utilisé dans un <AuthProvider>');
  return ctx;
};
