// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SafeUser } from '../schemas/user.schema';
import { InMemoryTokenStorage } from '../storage/token-storage';
import { AuthProvider, useAuthContext } from './AuthProvider';

const BASE_URL = 'http://api.test';

const storedUser: SafeUser = { id: 'u1', email: 'stored@opencarbon.dev', role: 'CONSULTANT' };
const loggedUser: SafeUser = { id: 'u2', email: 'login@opencarbon.dev', role: 'COMPANY' };

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const envelope = (data: unknown) => json(200, { success: true, data, message: '' });

type Route = (init?: RequestInit) => Promise<Response>;

describe('AuthProvider', () => {
  let storage: InMemoryTokenStorage;
  let routes: Record<string, Route>;

  const renderAuth = () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider baseUrl={BASE_URL} storage={storage}>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    );
    return renderHook(() => useAuthContext(), { wrapper });
  };

  beforeEach(() => {
    storage = new InMemoryTokenStorage();
    routes = {};
    vi.stubGlobal(
      'fetch',
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const route = routes[String(input).replace(BASE_URL, '')];
        if (!route) throw new Error(`Route non mockée : ${String(input)}`);
        return route(init);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Attend que l'hydratation ait bien émis sa requête /users/me. */
  const waitForMeRequest = () =>
    waitFor(() =>
      expect(vi.mocked(fetch).mock.calls.some(([input]) => String(input).endsWith('/users/me'))).toBe(true),
    );

  const storeSession = async () => {
    await storage.setAccessToken('stored-access');
    await storage.setRefreshToken('stored-refresh');
  };

  it('passe en guest sans token stocké', async () => {
    const { result } = renderAuth();

    await waitFor(() => expect(result.current.status).toBe('guest'));
  });

  it('restaure la session quand /users/me répond', async () => {
    await storeSession();
    routes['/users/me'] = () => Promise.resolve(envelope(storedUser));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user?.email).toBe(storedUser.email);
  });

  it('purge les tokens quand le backend invalide la session', async () => {
    await storeSession();
    routes['/users/me'] = () => Promise.resolve(json(401, { statusCode: 401 }));
    routes['/auth/refresh'] = () => Promise.resolve(json(401, { statusCode: 401 }));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.status).toBe('guest'));
    expect(await storage.getAccessToken()).toBeNull();
    expect(await storage.getRefreshToken()).toBeNull();
  });

  it('conserve les tokens hors-ligne et permet de réessayer', async () => {
    await storeSession();
    routes['/users/me'] = () => Promise.reject(new TypeError('Network request failed'));

    const { result } = renderAuth();

    await waitFor(() => expect(result.current.status).toBe('unreachable'));
    expect(await storage.getAccessToken()).toBe('stored-access');
    expect(await storage.getRefreshToken()).toBe('stored-refresh');

    routes['/users/me'] = () => Promise.resolve(envelope(storedUser));
    act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user?.email).toBe(storedUser.email);
  });

  it("ignore une hydratation périmée quand l'utilisateur se connecte entre-temps", async () => {
    await storeSession();
    let resolveMe: (r: Response) => void = () => undefined;
    routes['/users/me'] = () => new Promise<Response>((resolve) => (resolveMe = resolve));
    routes['/auth/refresh'] = () => Promise.resolve(json(401, { statusCode: 401 }));
    routes['/auth/login/email'] = () =>
      Promise.resolve(envelope({ access_token: 'login-access', refresh_token: 'login-refresh', user: loggedUser }));

    const { result } = renderAuth();
    await waitForMeRequest();

    await act(async () => {
      await result.current.login({ email: loggedUser.email, password: 'Secret123!' });
    });
    expect(result.current.status).toBe('authenticated');

    // L'ancienne hydratation se termine en échec après le login : elle ne doit rien écraser.
    await act(async () => {
      resolveMe(json(500, { statusCode: 500 }));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.status).toBe('authenticated');
    expect(result.current.user?.email).toBe(loggedUser.email);
    expect(await storage.getAccessToken()).toBe('login-access');
  });

  it('ignore une hydratation périmée après un logout', async () => {
    await storeSession();
    let resolveMe: (r: Response) => void = () => undefined;
    routes['/users/me'] = () => new Promise<Response>((resolve) => (resolveMe = resolve));
    routes['/auth/logout'] = () => Promise.resolve(envelope(null));

    const { result } = renderAuth();
    await waitForMeRequest();

    await act(async () => {
      await result.current.logout();
    });
    expect(result.current.status).toBe('guest');

    await act(async () => {
      resolveMe(envelope(storedUser));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.status).toBe('guest');
    expect(result.current.user).toBeNull();
  });
});
