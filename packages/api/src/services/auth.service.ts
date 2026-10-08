import type { HttpClient } from '../http/http-client';
import {
  AuthResponseSchema,
  type AuthResponse,
  type LoginInput,
  type RegisterInput,
} from '../schemas/auth.schema';
import { SafeUserSchema, type SafeUser } from '../schemas/user.schema';

// Fonctions pures : elles prennent le HttpClient et tapent les endpoints RÉELS du backend
// (attention : le POC Flutter utilisait /auth/login, obsolète — les vrais sont /email).

export const authService = {
  async register(http: HttpClient, input: RegisterInput): Promise<AuthResponse> {
    const data = await http.post<unknown>('/auth/register/email', input, { auth: false });
    return AuthResponseSchema.parse(data);
  },

  async login(http: HttpClient, input: LoginInput): Promise<AuthResponse> {
    const data = await http.post<unknown>('/auth/login/email', input, { auth: false });
    return AuthResponseSchema.parse(data);
  },

  async logout(http: HttpClient, refreshToken: string | null): Promise<void> {
    await http.post<unknown>('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {}, {
      auth: false,
    });
  },

  async me(http: HttpClient): Promise<SafeUser> {
    const data = await http.get<unknown>('/users/me');
    return SafeUserSchema.parse(data);
  },
};
