// Abstraction du stockage des tokens. Chaque plateforme fournit son implémentation :
//  - mobile : expo-secure-store (Keychain / Keystore)
//  - web    : le refresh est géré par cookie httpOnly, donc getRefreshToken/setRefreshToken
//             peuvent être des no-op (retourner null) ; seul l'access token est stocké.
//
// Côté natif il n'y a pas de cookie jar : on DOIT persister le refresh_token et
// l'envoyer explicitement dans le body de /auth/refresh (le backend l'accepte, cf.
// jwt-refresh.strategy.ts qui lit cookie OU body).

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setRefreshToken(token: string): Promise<void>;
  clear(): Promise<void>;
}

/** Implémentation mémoire — utile pour les tests ou le SSR. */
export class InMemoryTokenStorage implements TokenStorage {
  private access: string | null = null;
  private refresh: string | null = null;

  getAccessToken = (): Promise<string | null> => Promise.resolve(this.access);
  setAccessToken = (token: string): Promise<void> => {
    this.access = token;
    return Promise.resolve();
  };
  getRefreshToken = (): Promise<string | null> => Promise.resolve(this.refresh);
  setRefreshToken = (token: string): Promise<void> => {
    this.refresh = token;
    return Promise.resolve();
  };
  clear = (): Promise<void> => {
    this.access = null;
    this.refresh = null;
    return Promise.resolve();
  };
}
