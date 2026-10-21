// Configuration du client API. Le baseUrl est INJECTÉ par l'app hôte
// (mobile via expo-constants, web via env Next) — aucune lecture d'env ici,
// pour que le package reste agnostique de la plateforme.

export interface ApiConfig {
  /** URL de base de l'API backend, sans slash final. Ex: https://api.opencarbon.dev */
  baseUrl: string;
}

export const createApiConfig = (config: ApiConfig): ApiConfig => ({
  baseUrl: config.baseUrl.replace(/\/+$/, ''),
});
