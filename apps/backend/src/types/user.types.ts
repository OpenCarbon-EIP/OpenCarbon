import type {
  company_member,
  consultant,
  Role,
  user,
} from 'src/generated/prisma/client';

export type SafeUser = Omit<user, 'password' | 'createdAt' | 'updatedAt'> & {
  consultant?: consultant | null;
  company_members?: company_member[];
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
};

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
