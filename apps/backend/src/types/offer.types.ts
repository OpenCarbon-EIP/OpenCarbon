import type {
  offer,
  company,
  company_member,
} from 'src/generated/prisma/client';
import { SafeUser } from './user.types';

export type CompanyMemberWithUser = company_member & {
  user: SafeUser;
};

export type CompanyWithMembers = company & {
  members: CompanyMemberWithUser[];
};

export type OfferWithRelations = offer & {
  company: CompanyWithMembers;
};
