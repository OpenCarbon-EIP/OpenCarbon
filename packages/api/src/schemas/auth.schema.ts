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

/** Symboles reconnus par validator.js (utilisé par @IsStrongPassword() côté backend). */
const PASSWORD_SYMBOLS = /[-#!$@£%^&*()_+|~=`{}[\]:";'<>?,./\\ ]/;

/**
 * Règles de @IsStrongPassword() (valeurs par défaut de validator.js), exposées une par une
 * pour que l'UI puisse afficher leur état en temps réel.
 */
export const PASSWORD_RULES = [
  { label: '8 caractères minimum', test: (value: string) => value.length >= 8 },
  { label: 'Une minuscule', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Une majuscule', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Un chiffre', test: (value: string) => /[0-9]/.test(value) },
  { label: 'Un symbole', test: (value: string) => PASSWORD_SYMBOLS.test(value) },
] as const;

export const PasswordSchema = z
  .string()
  .refine((value) => PASSWORD_RULES.every((rule) => rule.test(value)), 'Mot de passe trop faible');

const consultantRegister = z.object({
  role: z.literal('CONSULTANT'),
  email: z.string().email('Email invalide'),
  password: PasswordSchema,
  last_name: z.string().min(1, 'Nom requis'),
  first_name: z.string().min(1, 'Prénom requis'),
  professional_title: z.string().min(1, 'Titre professionnel requis'),
  description: z.string().optional(),
});

const companyRegister = z.object({
  role: z.literal('COMPANY'),
  email: z.string().email('Email invalide'),
  password: PasswordSchema,
  company_name: z.string().min(1, "Nom de l'entreprise requis"),
  company_size: z.number().int().positive("Taille d'entreprise invalide").optional(),
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
