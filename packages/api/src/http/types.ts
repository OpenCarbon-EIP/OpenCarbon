// Enveloppes de réponse du backend NestJS (cf. src/types/global.ts et le HttpExceptionFilter).

/** Réponse de succès : { success, data, message }. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

/** Corps d'erreur normalisé par le HttpExceptionFilter : { statusCode, message }. */
export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
