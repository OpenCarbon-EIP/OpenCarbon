import type { ApiConfig } from '../config/env';
import type { TokenStorage } from '../storage/token-storage';
import { AuthFailure, NetworkFailure, mapHttpError } from './errors';
import type { ApiEnvelope, ApiErrorBody } from './types';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Corps JSON — sérialisé automatiquement. */
  json?: unknown;
  /** Injecter le Bearer token (défaut: true). */
  auth?: boolean;
  /** Autoriser le refresh + retry sur 401 (défaut: true). Passé à false pour éviter la récursion. */
  retryOnUnauthorized?: boolean;
}

export interface HttpClientOptions {
  config: ApiConfig;
  storage: TokenStorage;
  /** Appelé quand le refresh échoue définitivement — l'app doit purger la session. */
  onLogout?: () => void | Promise<void>;
}

/**
 * Client HTTP partagé mobile + web.
 *  - injecte l'access token en Authorization: Bearer
 *  - `credentials: 'include'` → le web envoie le cookie httpOnly de refresh
 *  - sur 401 : refresh single-flight (une seule requête concurrente) puis retry UNE fois
 *  - déballe l'enveloppe { success, data, message } et renvoie `data`
 */
export class HttpClient {
  private readonly config: ApiConfig;
  private readonly storage: TokenStorage;
  private readonly onLogout?: () => void | Promise<void>;
  /** Promesse de refresh en cours, partagée entre tous les appels concurrents. */
  private refreshing: Promise<boolean> | null = null;

  constructor({ config, storage, onLogout }: HttpClientOptions) {
    this.config = config;
    this.storage = storage;
    this.onLogout = onLogout;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { json, auth = true, retryOnUnauthorized = true, headers, ...rest } = options;

    const accessToken = auth ? await this.storage.getAccessToken() : null;
    const finalHeaders: Record<string, string> = {
      Accept: 'application/json',
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(headers as Record<string, string> | undefined),
    };

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}${path}`, {
        ...rest,
        headers: finalHeaders,
        credentials: 'include',
        body: json !== undefined ? JSON.stringify(json) : undefined,
      });
    } catch {
      throw new NetworkFailure();
    }

    if (response.status === 401 && auth && retryOnUnauthorized) {
      const refreshed = await this.refreshTokens();
      if (!refreshed) {
        await this.onLogout?.();
        throw new AuthFailure('Session expirée, veuillez vous reconnecter');
      }
      return this.request<T>(path, { ...options, retryOnUnauthorized: false });
    }

    return this.parse<T>(response);
  }

  get = <T>(path: string, options?: RequestOptions): Promise<T> =>
    this.request<T>(path, { ...options, method: 'GET' });

  post = <T>(path: string, json?: unknown, options?: RequestOptions): Promise<T> =>
    this.request<T>(path, { ...options, method: 'POST', json });

  put = <T>(path: string, json?: unknown, options?: RequestOptions): Promise<T> =>
    this.request<T>(path, { ...options, method: 'PUT', json });

  delete = <T>(path: string, options?: RequestOptions): Promise<T> =>
    this.request<T>(path, { ...options, method: 'DELETE' });

  /** Refresh single-flight : les 401 concurrents attendent la même promesse. */
  private refreshTokens(): Promise<boolean> {
    this.refreshing ??= this.doRefresh().finally(() => {
      this.refreshing = null;
    });
    return this.refreshing;
  }

  private async doRefresh(): Promise<boolean> {
    const refreshToken = await this.storage.getRefreshToken();
    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        // Natif : pas de cookie → on envoie le refresh_token dans le body.
        // Web : cookie httpOnly via credentials include → body vide accepté.
        body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
      });
    } catch {
      return false;
    }

    if (!response.ok) return false;

    try {
      const envelope = (await response.json()) as ApiEnvelope<{ access_token: string; refresh_token: string }>;
      const data = envelope.data;
      if (!data?.access_token) return false;
      await this.storage.setAccessToken(data.access_token);
      if (data.refresh_token) await this.storage.setRefreshToken(data.refresh_token);
      return true;
    } catch {
      return false;
    }
  }

  private async parse<T>(response: Response): Promise<T> {
    const raw = await response.text();
    const body: unknown = raw ? JSON.parse(raw) : undefined;

    if (!response.ok) {
      throw mapHttpError(response.status, body as ApiErrorBody | undefined);
    }

    // Déballe { success, data, message } → data. Tolère une réponse déjà "nue".
    if (body && typeof body === 'object' && 'data' in body) {
      return (body as ApiEnvelope<T>).data;
    }
    return body as T;
  }
}
