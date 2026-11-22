import { PrismaClient } from '@prisma/client';

// Global reference declaration to reuse connection pool across serverless invocations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Retain Prisma instance across hot reloads and serverless function invocations
globalForPrisma.prisma = prisma;

process.on('beforeExit', async () => {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
});
