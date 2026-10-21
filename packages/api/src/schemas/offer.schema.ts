import { z } from 'zod';
import { CompanySchema } from './user.schema';

// Stub — structure prête, à compléter quand on implémentera la feature "offers".
// Miroir du modèle Prisma `offer`.

export const OfferStatusSchema = z.enum(['OPEN', 'CLOSED']);
export type OfferStatus = z.infer<typeof OfferStatusSchema>;

export const OfferSchema = z
  .object({
    id: z.string(),
    id_company: z.string(),
    title: z.string(),
    description: z.string(),
    location: z.string(),
    budget: z.number(),
    deadline: z.string(), // ISO date
    status: OfferStatusSchema.default('OPEN'),
    company: CompanySchema.nullish(),
  })
  .passthrough();
export type Offer = z.infer<typeof OfferSchema>;
