import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryTokenStorage } from '../storage/token-storage';
import { AuthFailure, NetworkFailure, NotFoundFailure, ServerFailure } from './errors';
import { HttpClient } from './http-client';

const BASE_URL = 'http://api.test';

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const html = (status: number): Response => new Response('<html>Bad Gateway</html>', { status });

const refreshOk = (access = 'new-access', refresh = 'new-refresh') =>
  json(200, { success: true, data: { access_token: access, refresh_token: refresh }, message: '' });

const isRefresh = (input: RequestInfo | URL) => String(input) === `${BASE_URL}/auth/refresh`;

describe('HttpClient', () => {
  let storage: InMemoryTokenStorage;
  let onLogout: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: HttpClient;

  beforeEach(async () => {
    storage = new InMemoryTokenStorage();
    await storage.setAccessToken('old-access');
    await storage.setRefreshToken('old-refresh');
    onLogout = vi.fn();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    client = new HttpClient({ config: { baseUrl: BASE_URL }, storage, onLogout });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('requêtes', () => {
    it("injecte le Bearer token et déballe l'enveloppe", async () => {
      fetchMock.mockResolvedValueOnce(json(200, { success: true, data: { id: 1 }, message: '' }));

      await expect(client.get('/users/me')).resolves.toEqual({ id: 1 });
      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>).Authorization).toBe('Bearer old-access');
    });

    it('lève NetworkFailure quand le serveur est injoignable', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

      await expect(client.get('/users/me')).rejects.toBeInstanceOf(NetworkFailure);
    });

    it('mappe les statuts HTTP vers les AppError typées', async () => {
      fetchMock.mockResolvedValueOnce(json(404, { statusCode: 404, message: 'Offre introuvable' }));

      const error = await client.get('/offers/42').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(NotFoundFailure);
      expect((error as NotFoundFailure).message).toBe('Offre introuvable');
    });

    it("lève ServerFailure (et non SyntaxError) sur une page HTML d'erreur", async () => {
      fetchMock.mockResolvedValueOnce(html(502));

      const error = await client.get('/users/me').catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ServerFailure);
      expect((error as ServerFailure).status).toBe(502);
    });

    it('lève ServerFailure sur un 200 au corps non-JSON', async () => {
      fetchMock.mockResolvedValueOnce(html(200));

      await expect(client.get('/users/me')).rejects.toBeInstanceOf(ServerFailure);
    });
  });

  describe('refresh sur 401', () => {
    it('rafraîchit les tokens puis rejoue la requête une fois', async () => {
      fetchMock
        .mockResolvedValueOnce(json(401, { statusCode: 401 }))
        .mockResolvedValueOnce(refreshOk())
        .mockResolvedValueOnce(json(200, { success: true, data: 'ok', message: '' }));

      await expect(client.get('/users/me')).resolves.toBe('ok');
      expect(await storage.getAccessToken()).toBe('new-access');
      expect(await storage.getRefreshToken()).toBe('new-refresh');
      const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
      expect((retryInit.headers as Record<string, string>).Authorization).toBe('Bearer new-access');
      expect(onLogout).not.toHaveBeenCalled();
    });

    it("n'émet qu'un seul refresh pour des 401 concurrents (single-flight)", async () => {
      let resolveRefresh: (r: Response) => void = () => undefined;
      fetchMock.mockImplementation((input: RequestInfo | URL) => {
        if (isRefresh(input)) return new Promise<Response>((resolve) => (resolveRefresh = resolve));
        return storage
          .getAccessToken()
          .then((token) =>
            token === 'new-access'
              ? json(200, { success: true, data: 'ok', message: '' })
              : json(401, { statusCode: 401 }),
          );
      });

      const calls = Promise.all([client.get('/a'), client.get('/b'), client.get('/c')]);
      await vi.waitFor(() => expect(fetchMock.mock.calls.filter(([input]) => isRefresh(input))).toHaveLength(1));
      resolveRefresh(refreshOk());

      await expect(calls).resolves.toEqual(['ok', 'ok', 'ok']);
      expect(fetchMock.mock.calls.filter(([input]) => isRefresh(input))).toHaveLength(1);
    });

    it('purge la session et appelle onLogout quand le refresh est rejeté (401)', async () => {
      fetchMock
        .mockResolvedValueOnce(json(401, { statusCode: 401 }))
        .mockResolvedValueOnce(json(401, { statusCode: 401, message: 'Refresh token révoqué' }));

      await expect(client.get('/users/me')).rejects.toBeInstanceOf(AuthFailure);
      expect(onLogout).toHaveBeenCalledOnce();
      expect(await storage.getAccessToken()).toBeNull();
      expect(await storage.getRefreshToken()).toBeNull();
    });

    it('conserve la session quand le refresh échoue faute de réseau', async () => {
      fetchMock
        .mockResolvedValueOnce(json(401, { statusCode: 401 }))
        .mockRejectedValueOnce(new TypeError('Network request failed'));

      await expect(client.get('/users/me')).rejects.toBeInstanceOf(NetworkFailure);
      expect(onLogout).not.toHaveBeenCalled();
      expect(await storage.getRefreshToken()).toBe('old-refresh');
    });

    it('conserve la session quand le refresh renvoie une erreur serveur', async () => {
      fetchMock.mockResolvedValueOnce(json(401, { statusCode: 401 })).mockResolvedValueOnce(html(503));

      await expect(client.get('/users/me')).rejects.toBeInstanceOf(ServerFailure);
      expect(onLogout).not.toHaveBeenCalled();
      expect(await storage.getRefreshToken()).toBe('old-refresh');
    });

    it('ne tente pas de refresh pour une requête non authentifiée', async () => {
      fetchMock.mockResolvedValueOnce(json(401, { statusCode: 401, message: 'Identifiants invalides' }));

      await expect(client.post('/auth/login/email', {}, { auth: false })).rejects.toBeInstanceOf(AuthFailure);
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(onLogout).not.toHaveBeenCalled();
    });
  });
});
