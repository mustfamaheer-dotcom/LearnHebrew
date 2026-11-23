import Redis from 'ioredis';

// In-memory fallback cache with TTL support
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry>();

// Initialize Redis client with resilient configuration
const hasRedisConfig = !!process.env.REDIS_URL;
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let isRedisReady = false;

const redisOptions: any = {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  connectTimeout: 3000,
  enableOfflineQueue: false,
  retryStrategy(times: number) {
    if (!hasRedisConfig || times > 2) {
      return null; // Stop retrying if no explicit REDIS_URL or after 2 tries
    }
    return 1000;
  },
};

// Automatic TLS handling for Upstash Redis / Redis Cloud (rediss://)
if (redisUrl.startsWith('rediss://')) {
  redisOptions.tls = { rejectUnauthorized: false };
}

export const redis = new Redis(redisUrl, redisOptions);

redis.on('connect', () => {
  isRedisReady = true;
  console.log('[Cache] Redis connected successfully.');
});

redis.on('error', (_err) => {
  isRedisReady = false;
});

// Attempt initial connection only when explicit REDIS_URL is configured
if (hasRedisConfig) {
  redis.connect().catch(() => {
    isRedisReady = false;
  });
}

export function getIsRedisReady(): boolean {
  return isRedisReady;
}

/**
 * Retrieve cached JSON value by key
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (isRedisReady) {
    try {
      const raw = await redis.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Fallback to memory
    }
  }

  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Set cached JSON value with TTL in seconds (default: 60s)
 */
export async function cacheSet(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
  if (isRedisReady) {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch {
      // Fallback to memory
    }
  }

  memCache.set(key, {
    data: value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate cache key(s)
 */
export async function cacheDel(key: string): Promise<void> {
  if (isRedisReady) {
    try {
      await redis.del(key);
    } catch {
      // Fallback to memory
    }
  }
  memCache.delete(key);
}

// In-flight promise registry to prevent cache stampedes (Single-Flight Pattern)
const inFlightPromises = new Map<string, Promise<any>>();

/**
 * Invalidate keys matching a prefix/wildcard using non-blocking SCAN
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  if (isRedisReady) {
    try {
      let cursor = '0';
      do {
        // Use non-blocking SCAN with batching to avoid locking Redis event loop
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      // Fallback
    }
  }

  for (const k of memCache.keys()) {
    if (k.startsWith(prefix)) {
      memCache.delete(k);
    }
  }
}

/**
 * Transparent fetch-through cache wrapper with Single-Flight Stampede Defense.
 * If 500 concurrent requests request an expired/missing key simultaneously,
 * only 1 query hits PostgreSQL and all 500 receive the resolved result.
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null && cached !== undefined) {
    return cached;
  }

  // Check if there is already an in-flight fetch for this key
  let inFlight = inFlightPromises.get(key);
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const fresh = await fetcher();
        await cacheSet(key, fresh, ttlSeconds);
        return fresh;
      } finally {
        inFlightPromises.delete(key);
      }
    })();
    inFlightPromises.set(key, inFlight);
  }

  return inFlight as Promise<T>;
}

