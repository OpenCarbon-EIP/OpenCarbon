import type { Prisma } from 'src/generated/prisma/client';

export const MISSION_DETAIL_INCLUDE = {
  company: true,
  consultant: true,
  application: { include: { offer: true } },
  worksites: true,
} as const satisfies Prisma.missionInclude;

export type MissionWithDetails = Prisma.missionGetPayload<{
  include: typeof MISSION_DETAIL_INCLUDE;
}>;
