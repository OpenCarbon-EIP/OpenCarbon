import { z } from 'zod';
import { SafeUserSchema } from './user.schema';

// Miroir du RegisterDto / LoginDto backend (src/dtos/auth.dto.ts).
// Union discriminée sur `role` → validation côté client des champs conditionnels
// (consultant vs company), équivalent des @ValidateIf du backend.

export const LoginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

const consultantRegister = z.object({
  role: z.literal('CONSULTANT'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
  last_name: z.string().min(1, 'Nom requis'),
  first_name: z.string().min(1, 'Prénom requis'),
  professional_title: z.string().min(1, 'Titre professionnel requis'),
  description: z.string().optional(),
});

const companyRegister = z.object({
  role: z.literal('COMPANY'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe trop court'),
  company_name: z.string().min(1, "Nom de l'entreprise requis"),
  company_size: z.number().int().positive().optional(),
  description: z.string().optional(),
});

export const RegisterSchema = z.discriminatedUnion('role', [consultantRegister, companyRegister]);
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const AuthResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  user: SafeUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
