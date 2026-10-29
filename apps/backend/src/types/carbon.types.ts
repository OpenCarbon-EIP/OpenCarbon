import type { Prisma } from 'src/generated/prisma/client';

export const CLIENT_DETAIL_INCLUDE = {
  company: true,
  worksites: { orderBy: { start_date: 'desc' } },
} as const satisfies Prisma.clientInclude;

export type ClientWithDetails = Prisma.clientGetPayload<{
  include: typeof CLIENT_DETAIL_INCLUDE;
}>;

export const WORKSITE_DETAIL_INCLUDE = {
  client: true,
  mission: true,
  assessments: { orderBy: { created_at: 'desc' } },
  documents: { orderBy: { uploaded_at: 'desc' } },
} as const satisfies Prisma.worksiteInclude;

export type WorksiteWithDetails = Prisma.worksiteGetPayload<{
  include: typeof WORKSITE_DETAIL_INCLUDE;
}>;

export type WorksiteWithClient = Prisma.worksiteGetPayload<{
  include: { client: true };
}>;

export const ASSESSMENT_DETAIL_INCLUDE = {
  worksite: true,
  activity_lines: {
    include: { category: true },
    orderBy: { created_at: 'asc' },
  },
  actions: { orderBy: { created_at: 'asc' } },
} as const satisfies Prisma.assessmentInclude;

export type AssessmentWithDetails = Prisma.assessmentGetPayload<{
  include: typeof ASSESSMENT_DETAIL_INCLUDE;
}>;

export type AssessmentWithOwner = Prisma.assessmentGetPayload<{
  include: { worksite: { include: { client: true } } };
}>;

export const DOCUMENT_DETAIL_INCLUDE = {
  extractions: { orderBy: { created_at: 'asc' } },
} as const satisfies Prisma.documentInclude;

export type DocumentWithDetails = Prisma.documentGetPayload<{
  include: typeof DOCUMENT_DETAIL_INCLUDE;
}>;

export type DocumentWithOwner = Prisma.documentGetPayload<{
  include: { worksite: { include: { client: true } } };
}>;

export const EXTRACTION_DETAIL_INCLUDE = {
  proposed_category: true,
  proposed_factor: true,
  activity_line: true,
} as const satisfies Prisma.extractionInclude;

export type ExtractionWithDetails = Prisma.extractionGetPayload<{
  include: typeof EXTRACTION_DETAIL_INCLUDE;
}>;

export const ACTIVITY_LINE_DETAIL_INCLUDE = {
  category: true,
  emission_factor: true,
  extraction: true,
} as const satisfies Prisma.activity_lineInclude;

export type ActivityLineWithDetails = Prisma.activity_lineGetPayload<{
  include: typeof ACTIVITY_LINE_DETAIL_INCLUDE;
}>;

export const REDUCTION_ACTION_DETAIL_INCLUDE = {
  activity_line: true,
  alternative_factor: true,
} as const satisfies Prisma.reduction_actionInclude;

export type ReductionActionWithDetails = Prisma.reduction_actionGetPayload<{
  include: typeof REDUCTION_ACTION_DETAIL_INCLUDE;
}>;

export const EMISSION_FACTOR_DETAIL_INCLUDE = {
  default_category: true,
} as const satisfies Prisma.emission_factorInclude;

export type EmissionFactorWithCategory = Prisma.emission_factorGetPayload<{
  include: typeof EMISSION_FACTOR_DETAIL_INCLUDE;
}>;
