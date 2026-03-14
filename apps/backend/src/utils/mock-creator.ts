import {
  application,
  company,
  consultant,
  offer,
} from 'src/generated/prisma/client';
import { OfferWithRelations } from 'src/types/offer.types';
import { SafeUser } from 'src/types/user.types';

export const createMockOfferWithRelations = (
  overrides?: Partial<OfferWithRelations>,
): OfferWithRelations => ({
  id: 'offer-123',
  title: 'Carbon Audit',
  description: 'Full assessment',
  budget: 15000,
  location: 'Bordeaux, France',
  deadline: new Date('2025-12-31'),
  status: 'OPEN',
  id_company: 'company-uuid',
  company: {
    id: 'company-uuid',
    description: 'We are a company that cares about the environment.',
    company_size: 500,
    id_user: 'user-123',
    company_name: 'My Company',
    industry_sector: 'Technology',
    logo_url: null,
    user: {
      id: 'user-123',
      email: 'company@example.com',
      role: 'COMPANY',
    },
  },
  ...overrides,
});

export const createMockOfferWithRelationsList = (
  count: number,
  overrides?: Partial<OfferWithRelations>,
): OfferWithRelations[] => {
  const offers: OfferWithRelations[] = [];
  for (let i = 0; i < count; i++) {
    offers.push(
      createMockOfferWithRelations({
        id: `offer-${i + 1}`,
        title: `Offer ${i + 1}`,
        ...overrides,
      }),
    );
  }
  return offers;
};

export const createMockCompany = (overrides?: Partial<company>): company => ({
  id: 'company-uuid',
  description: 'We are a company that cares about the environment.',
  company_size: 500,
  id_user: 'user-123',
  company_name: 'My Company',
  industry_sector: 'Technology',
  logo_url: null,
  ...overrides,
});

export const createMockConsultant = (
  overrides?: Partial<consultant>,
): consultant => ({
  id: 'consul-123',
  id_user: 'user-123',
  last_name: 'Doe',
  first_name: 'John',
  professional_title: 'Software Engineer',
  description: 'Experienced consultant',
  photo_url: null,
  rating_score: 4.5,
  is_verified: true,
  ...overrides,
});

export const createMockUserCompany = (
  overrides?: Partial<SafeUser>,
): SafeUser => ({
  id: 'user-123',
  email: 'company@example.com',
  role: 'COMPANY',
  ...overrides,
});

export const createMockUserConsultant = (
  overrides?: Partial<SafeUser>,
): SafeUser => ({
  id: 'user-123',
  email: 'consultant@example.com',
  role: 'CONSULTANT',
  ...overrides,
});

export const createMockOffer = (overrides?: Partial<offer>): offer => ({
  id: 'offer-123',
  title: 'Carbon Audit',
  description: 'Full assessment',
  budget: 15000,
  location: 'Bordeaux, France',
  deadline: new Date('2025-12-31'),
  status: 'OPEN',
  id_company: 'company-uuid',
  ...overrides,
});

export const createMockOfferList = (
  count: number,
  overrides?: Partial<offer>,
): offer[] => {
  const offers: offer[] = [];
  for (let i = 0; i < count; i++) {
    offers.push(
      createMockOffer({
        id: `offer-${i + 1}`,
        title: `Offer ${i + 1}`,
        ...overrides,
      }),
    );
  }
  return offers;
};

export const createMockApplication = (
  overrides?: Partial<application>,
): application => ({
  id: 'application-123',
  id_offer: 'offer-123',
  id_consultant: 'consul-123',
  status: 'PENDING',
  content: 'I am interested in this offer.',
  ...overrides,
});

export const createMockApplicationList = (
  count: number,
  overrides?: Partial<application>,
): application[] => {
  const applications: application[] = [];
  for (let i = 0; i < count; i++) {
    applications.push(
      createMockApplication({
        id: `application-${i + 1}`,
        id_offer: `offer-${Math.ceil((i + 1) / 2)}`,
        ...overrides,
      }),
    );
  }
  return applications;
};
