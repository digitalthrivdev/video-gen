import { PrismaClient, Prisma } from './generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma logging based on environment variables
const getPrismaLogLevel = (): Prisma.LogLevel[] => {
  if (process.env.PRISMA_LOG_QUERIES === 'true') {
    return ['query', 'error', 'warn', 'info'];
  } else if (process.env.PRISMA_LOG_QUERIES === 'false') {
    return ['error'];
  } else if (process.env.NODE_ENV === 'development') {
    return ['error', 'warn'];
  } else {
    return ['error'];
  }
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: getPrismaLogLevel(),
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
