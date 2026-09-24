import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createApiConfig } from '../config/env';
import { HttpClient } from '../http/http-client';
import type { TokenStorage } from '../storage/token-storage';
import { authService } from '../services/auth.service';
import type { AuthResponse, LoginInput, RegisterInput } from '../schemas/auth.schema';
import type { SafeUser } from '../schemas/user.schema';
import { queryKeys } from './query-keys';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export interface AuthContextValue {
  status: AuthStatus;
  user: SafeUser | null;
  /** Client HTTP authentifié à réutiliser pour les autres features. */
  client: HttpClient;
  login: (input: LoginInput) => Promise<AuthResponse>;
  register: (input: RegisterInput) => Promise<AuthResponse>;
  logout: () => Promise<void>;
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
    void (async () => {
      const token = await storage.getAccessToken();
      if (!token) {
        if (!cancelled) setStatus('guest');
        return;
      }
      try {
        const me = await authService.me(client);
        if (cancelled) return;
        setUser(me);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        await storage.clear();
        setStatus('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client, storage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      client,
      login: async (input) => applySession(await authService.login(client, input)),
      register: async (input) => applySession(await authService.register(client, input)),
      logout: async () => {
        const refresh = await storage.getRefreshToken();
        try {
          await authService.logout(client, refresh);
        } finally {
          await storage.clear();
          resetSession.current();
        }
      },
    }),
    // applySession/resetSession sont stables via client/storage.
    [status, user, client, storage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext doit être utilisé dans un <AuthProvider>');
  return ctx;
};
