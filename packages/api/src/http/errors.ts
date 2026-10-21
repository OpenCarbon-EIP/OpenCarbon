// Hiérarchie d'erreurs typées, reprend l'esprit des AppErrors de l'app Flutter
// (lib/core/errors/app_errors.dart) mais côté client TS partagé.

import type { ApiErrorBody } from './types';

export class AppError extends Error {
  readonly status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = new.target.name;
    this.status = status;
  }
}

/** 401 — session expirée / invalide. */
export class AuthFailure extends AppError {}
/** 403 — droits insuffisants / ownership. */
export class UnauthorizedFailure extends AppError {}
/** 400 / 422 — validation des champs. */
export class ValidationFailure extends AppError {
  readonly issues: string[];
  constructor(issues: string[], message?: string, status?: number) {
    super(message ?? issues[0] ?? 'Données invalides', status);
    this.issues = issues;
  }
}
/** 404. */
export class NotFoundFailure extends AppError {}
/** 5xx. */
export class ServerFailure extends AppError {}
/** Échec réseau (pas de réponse du serveur). */
export class NetworkFailure extends AppError {
  constructor(message = 'Impossible de joindre le serveur') {
    super(message);
  }
}
/** Configuration manquante (baseUrl, etc.). */
export class EnvironmentFailure extends AppError {}

const normalizeMessage = (message?: string | string[]): string | undefined =>
  Array.isArray(message) ? message.join(', ') : message;

/** Mappe un status HTTP + corps d'erreur backend vers une AppError typée. */
export const mapHttpError = (status: number, body?: ApiErrorBody): AppError => {
  const message = normalizeMessage(body?.message);
  switch (status) {
    case 400:
    case 422: {
      const issues = Array.isArray(body?.message)
        ? body.message
        : message
          ? [message]
          : ['Données invalides'];
      return new ValidationFailure(issues, message, status);
    }
    case 401:
      return new AuthFailure(message ?? 'Session expirée ou invalide', status);
    case 403:
      return new UnauthorizedFailure(message ?? 'Accès refusé', status);
    case 404:
      return new NotFoundFailure(message ?? 'Ressource introuvable', status);
    default:
      if (status >= 500) {
        return new ServerFailure(message ?? 'Erreur serveur', status);
      }
      return new AppError(message ?? `Erreur HTTP ${status}`, status);
  }
};
