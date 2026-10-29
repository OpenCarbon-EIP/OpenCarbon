import {
  activity_line,
  application,
  assessment,
  client,
  company,
  consultant,
  document,
  emission_category,
  emission_factor,
  extraction,
  mission,
  offer,
  Prisma,
  reduction_action,
  worksite,
} from 'src/generated/prisma/client';
import { OfferWithRelations } from 'src/types/offer.types';
import { SafeUser } from 'src/types/user.types';
import {
  AssessmentWithOwner,
  DocumentWithOwner,
  WorksiteWithClient,
} from 'src/types/carbon.types';

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
    company_name: 'My Company',
    industry_sector: 'Technology',
    logo_url: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: 'member-123',
        id_company: 'company-uuid',
        id_user: 'user-123',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-123',
          email: 'company@example.com',
          role: 'COMPANY',
        },
      },
    ],
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
  company_name: 'My Company',
  industry_sector: 'Technology',
  logo_url: null,
  createdAt: new Date(),
  updatedAt: new Date(),
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

export const createMockClient = (overrides?: Partial<client>): client => ({
  id: 'client-123',
  company_name: 'Colas Sud-Ouest',
  siren: '552081317',
  employee_count: 120,
  sector: 'Travaux publics',
  contact_name: 'Marie Dupont',
  contact_email: 'marie.dupont@example.com',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  id_consultant: 'consul-123',
  id_company: null,
  ...overrides,
});

export const createMockWorksite = (
  overrides?: Partial<worksite>,
): worksite => ({
  id: 'worksite-123',
  name: 'Réfection RD 936',
  project_owner: 'Département de la Gironde',
  contract_reference: 'MP-2026-0412',
  address: 'RD 936, 33750 Beychac-et-Caillau',
  work_type: 'ROADWORKS',
  start_date: new Date('2026-03-01'),
  end_date: new Date('2026-09-30'),
  functional_unit_value: new Prisma.Decimal(7000),
  functional_unit_label: 'm² de chaussée',
  organizational_boundary: 'OPERATIONAL_CONTROL',
  subcontractors_included: true,
  boundary_justification: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  id_client: 'client-123',
  id_mission: null,
  ...overrides,
});

export const createMockWorksiteWithClient = (
  overrides?: Partial<worksite>,
  clientOverrides?: Partial<client>,
): WorksiteWithClient => ({
  ...createMockWorksite(overrides),
  client: createMockClient(clientOverrides),
});

export const createMockAssessment = (
  overrides?: Partial<assessment>,
): assessment => ({
  id: 'assessment-123',
  type: 'ACTUAL',
  status: 'DRAFT',
  maturity_level: 'INITIAL',
  title: 'Bilan réel',
  total_kgco2e: new Prisma.Decimal(0),
  total_uncertainty_pct: null,
  computed_at: new Date('2026-01-01'),
  validated_at: null,
  sent_at: null,
  report_url: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  id_worksite: 'worksite-123',
  ...overrides,
});

export const createMockAssessmentWithOwner = (
  overrides?: Partial<assessment>,
  clientOverrides?: Partial<client>,
): AssessmentWithOwner => ({
  ...createMockAssessment(overrides),
  worksite: createMockWorksiteWithClient({}, clientOverrides),
});

export const createMockEmissionCategory = (
  overrides?: Partial<emission_category>,
): emission_category => ({
  id: 'category-123',
  code: '2_carburant_engins',
  label: 'Carburant des engins de chantier',
  iso_14064_category: '1',
  bilan_carbone_v9_post: null,
  is_direct: true,
  sort_order: 2,
  ...overrides,
});

export const createMockEmissionFactor = (
  overrides?: Partial<emission_factor>,
): emission_factor => ({
  id: 'factor-123',
  source: 'BASE_EMPREINTE',
  external_id: '14086',
  name: 'Gazole non routier',
  attribute: null,
  boundary: null,
  value_kgco2e: new Prisma.Decimal(3.17),
  per_unit: 'LITRE',
  uncertainty_pct: new Prisma.Decimal(4),
  scope_note: null,
  location: 'France continentale',
  status: 'VALID_GENERIC',
  source_reference: null,
  database_version: '23.6',
  retrieved_at: new Date('2026-01-01'),
  created_at: new Date('2026-01-01'),
  id_default_category: 'category-123',
  id_consultant: null,
  ...overrides,
});

export const createMockActivityLine = (
  overrides?: Partial<activity_line>,
): activity_line => ({
  id: 'line-123',
  label: 'GNR pelle 20 t',
  input_quantity: new Prisma.Decimal(1000),
  input_unit: 'LITRE',
  conversion_factor: null,
  conversion_note: null,
  calc_quantity: new Prisma.Decimal(1000),
  calc_unit: 'LITRE',
  fe_value_kgco2e: new Prisma.Decimal(3.17),
  fe_label: 'Gazole non routier',
  fe_uncertainty_pct: new Prisma.Decimal(4),
  fe_database_version: '23.6',
  data_uncertainty_pct: new Prisma.Decimal(3),
  data_origin: 'MEASURED',
  entry_mode: 'MANUAL',
  result_kgco2e: new Prisma.Decimal(3170),
  line_uncertainty_pct: new Prisma.Decimal(5),
  is_validated: false,
  validated_at: null,
  comment: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  id_assessment: 'assessment-123',
  id_category: 'category-123',
  id_emission_factor: 'factor-123',
  id_extraction: null,
  ...overrides,
});

export const createMockReductionAction = (
  overrides?: Partial<reduction_action>,
): reduction_action => ({
  id: 'action-123',
  label: 'Remplacer le GNR par du HVO',
  description: null,
  estimated_reduction_kgco2e: new Prisma.Decimal(2670),
  status: 'PROPOSED',
  created_at: new Date('2026-01-01'),
  id_assessment: 'assessment-123',
  id_activity_line: null,
  id_alternative_factor: null,
  ...overrides,
});

export const createMockDocument = (
  overrides?: Partial<document>,
): document => ({
  id: 'document-123',
  file_name: 'facture-carburant-mars.pdf',
  storage_url: 'https://storage.example.com/facture-carburant-mars.pdf',
  mime_type: 'application/pdf',
  size_bytes: 245760,
  sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  detected_type: 'FUEL_INVOICE',
  extraction_status: 'PENDING',
  extraction_error: null,
  uploaded_at: new Date('2026-01-01'),
  id_worksite: 'worksite-123',
  ...overrides,
});

export const createMockDocumentWithOwner = (
  overrides?: Partial<document>,
  clientOverrides?: Partial<client>,
): DocumentWithOwner => ({
  ...createMockDocument(overrides),
  worksite: createMockWorksiteWithClient({}, clientOverrides),
});

export const createMockExtraction = (
  overrides?: Partial<extraction>,
): extraction => ({
  id: 'extraction-123',
  page: 1,
  bounding_box: null,
  raw_values: { designation: 'GNR', quantite: '1000', unite: 'L' },
  product_label: 'Gazole non routier',
  quantity: new Prisma.Decimal(1000),
  unit: 'LITRE',
  document_date: new Date('2026-03-31'),
  supplier_name: 'TotalEnergies',
  supplier_address: null,
  confidence: new Prisma.Decimal(0.92),
  status: 'PROPOSED',
  correction: null,
  reviewed_at: null,
  created_at: new Date('2026-01-01'),
  id_document: 'document-123',
  id_proposed_category: 'category-123',
  id_proposed_factor: 'factor-123',
  ...overrides,
});

export const createMockMission = (overrides?: Partial<mission>): mission => ({
  id: 'mission-123',
  start_date: new Date('2026-11-01'),
  end_date: null,
  estimated_end_date: new Date('2027-02-28'),
  progress: 0,
  payment_status: 'PENDING',
  status: 'ONGOING',
  id_application: 'application-123',
  id_company: 'company-uuid',
  id_consultant: 'consul-123',
  ...overrides,
});
