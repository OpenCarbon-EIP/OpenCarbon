import { z } from 'zod';

// Miroir des modèles Prisma (consultant / company) et du type SafeUser du backend
// (src/types/user.types.ts). Volontairement tolérant (.nullish, passthrough) pour ne
// pas casser si le backend ajoute des champs.

export const RoleSchema = z.enum(['CONSULTANT', 'COMPANY']);
export type Role = z.infer<typeof RoleSchema>;

export const ConsultantSchema = z
  .object({
    id: z.string(),
    id_user: z.string(),
    first_name: z.string(),
    last_name: z.string(),
    professional_title: z.string(),
    description: z.string().nullish(),
    photo_url: z.string().nullish(),
    rating_score: z.number().default(0),
    is_verified: z.boolean().default(false),
  })
  .passthrough();
export type Consultant = z.infer<typeof ConsultantSchema>;

export const CompanySchema = z
  .object({
    id: z.string(),
    id_user: z.string(),
    company_name: z.string(),
    industry_sector: z.unknown().nullish(),
    company_size: z.number().nullish(),
    description: z.string().nullish(),
    logo_url: z.string().nullish(),
  })
  .passthrough();
export type Company = z.infer<typeof CompanySchema>;

export const SafeUserSchema = z
  .object({
    id: z.string(),
    email: z.string().email(),
    role: RoleSchema,
    consultant: ConsultantSchema.nullish(),
    company: CompanySchema.nullish(),
  })
  .passthrough();
export type SafeUser = z.infer<typeof SafeUserSchema>;
