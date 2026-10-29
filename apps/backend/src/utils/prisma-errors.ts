import { Prisma } from 'src/generated/prisma/client';

const PRISMA_UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export const isUniqueConstraintViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === PRISMA_UNIQUE_CONSTRAINT_VIOLATION;
