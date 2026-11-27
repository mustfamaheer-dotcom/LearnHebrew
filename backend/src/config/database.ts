import { PrismaClient } from '@prisma/client';

// Global reference declaration to reuse connection pool across serverless invocations
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Optimizes the PostgreSQL database URL for serverless environments (Vercel, AWS Lambda)
 * Ensures PgBouncer / Connection Pooler compatibility:
 * - Appends pgbouncer=true if connecting to Supabase Pooler (port 6543) or Neon (-pooler)
 * - Limits connection_limit per serverless container to prevent exhausting DB connections
 * - Adds pool_timeout to prevent hanging queries
 */
export function getOptimizedDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  try {
    const url = new URL(rawUrl);
    const isServerless =
      !!process.env.VERCEL ||
      !!process.env.AWS_LAMBDA_FUNCTION_VERSION ||
      process.env.NODE_ENV === 'production';

    const isPooler =
      url.port === '6543' ||
      url.hostname.includes('pooler.supabase.com') ||
      url.hostname.includes('-pooler.') ||
      url.searchParams.get('pgbouncer') === 'true';

    // 1. If using a connection pooler (like Supabase port 6543 or Neon pooler), ensure pgbouncer=true
    if (isPooler && !url.searchParams.has('pgbouncer')) {
      url.searchParams.set('pgbouncer', 'true');
    }

    // 2. In serverless, limit connections to 2 to prevent Supabase pooler exhaustion (EMAXCONNSESSION)
    if (isServerless) {
      url.searchParams.set('connection_limit', '2');
    }

    // 3. Set pool timeout to at least 20s to accommodate batched multi-query reporting dashboards
    const currentPoolTimeout = url.searchParams.get('pool_timeout');
    if (!currentPoolTimeout || Number(currentPoolTimeout) < 20) {
      url.searchParams.set('pool_timeout', '20');
    }

    // 4. Set connect timeout to at least 20s
    const currentConnectTimeout = url.searchParams.get('connect_timeout');
    if (!currentConnectTimeout || Number(currentConnectTimeout) < 20) {
      url.searchParams.set('connect_timeout', '20');
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

const dbUrl = getOptimizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Retain Prisma instance across hot reloads and serverless function invocations
globalForPrisma.prisma = prisma;

process.on('beforeExit', async () => {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect();
  }
});
