import type { offer, company } from 'src/generated/prisma/client';
import { SafeUser } from './user.types';

export type CompanyWithUser = company & {
  user: SafeUser;
};

export type OfferWithRelations = offer & {
  company: CompanyWithUser;
};
