import { z } from 'zod';

// Stub — structure prête, à compléter avec la feature "applications".
// Miroir du modèle Prisma `application`.

export const ApplicationStatusSchema = z.enum(['PENDING', 'ACCEPTED', 'REJECTED']);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const ApplicationSchema = z
  .object({
    id: z.string(),
    id_offer: z.string(),
    id_consultant: z.string(),
    content: z.string(),
    status: ApplicationStatusSchema.default('PENDING'),
  })
  .passthrough();
export type Application = z.infer<typeof ApplicationSchema>;
