import Redis from 'ioredis';

// In-memory fallback cache with TTL support
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const memCache = new Map<string, CacheEntry>();

// Initialize Redis client with resilient configuration
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
let isRedisReady = false;

export const redis = new Redis(redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  connectTimeout: 2000,
  enableOfflineQueue: false,
  retryStrategy(times) {
    if (times > 3) {
      return null; // Stop retrying after 3 failed attempts
    }
    return Math.min(times * 1000, 3000);
  },
});

redis.on('connect', () => {
  isRedisReady = true;
  console.log('[Cache] Redis connected successfully.');
});

redis.on('error', (err) => {
  isRedisReady = false;
  // Silently fail over to memory cache without throwing uncaught errors
  // console.warn('[Cache] Redis unavailable, fallback to in-memory cache:', err.message);
});

// Attempt initial connection without blocking app startup
redis.connect().catch(() => {
  isRedisReady = false;
});

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

/**
 * Invalidate keys matching a prefix/wildcard
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  if (isRedisReady) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
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
 * Transparent fetch-through cache wrapper
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

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}
