import { SafeUser } from './user.types';

export interface AuthResponse {
  access_token: string;
  user: SafeUser;
}
