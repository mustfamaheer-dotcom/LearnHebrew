import rateLimit, { MemoryStore } from 'express-rate-limit';
import type { Store, Options, ClientRateLimitInfo } from 'express-rate-limit';
import { redis, getIsRedisReady } from '../lib/cache';

/**
 * Resilient Redis Store adapter for Express Rate Limit
 * When Redis is connected (via REDIS_URL), hit counters are synchronized across
 * all Vercel serverless containers. When disconnected or unavailable, seamlessly
 * falls back to the local MemoryStore with zero errors.
 */
class ResilientRedisStore implements Store {
  prefix: string;
  localKeys?: boolean = false;
  private windowMs: number = 15 * 60 * 1000;
  private fallbackStore: MemoryStore;

  constructor(prefix: string) {
    this.prefix = prefix;
    this.fallbackStore = new MemoryStore();
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
    this.fallbackStore.init(options);
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    if (getIsRedisReady()) {
      try {
        const fullKey = `rl:${this.prefix}:${key}`;
        const p = redis.pipeline();
        p.incr(fullKey);
        p.pttl(fullKey);
        const results = await p.exec();

        const totalHits = Number(results?.[0]?.[1]) || 1;
        let ttl = Number(results?.[1]?.[1]);

        if (ttl < 0) {
          await redis.pexpire(fullKey, this.windowMs);
          ttl = this.windowMs;
        }

        return {
          totalHits,
          resetTime: new Date(Date.now() + Math.max(0, ttl)),
        };
      } catch {
        // Fallback to memory store on any Redis failure
      }
    }

    return this.fallbackStore.increment(key);
  }

  async decrement(key: string): Promise<void> {
    if (getIsRedisReady()) {
      try {
        const fullKey = `rl:${this.prefix}:${key}`;
        await redis.decr(fullKey);
        return;
      } catch {
        // Fallback
      }
    }
    return this.fallbackStore.decrement(key);
  }

  async resetKey(key: string): Promise<void> {
    if (getIsRedisReady()) {
      try {
        const fullKey = `rl:${this.prefix}:${key}`;
        await redis.del(fullKey);
        return;
      } catch {
        // Fallback
      }
    }
    return this.fallbackStore.resetKey(key);
  }

  async resetAll(): Promise<void> {
    return this.fallbackStore.resetAll();
  }
}

/**
 * Strict rate limiter for sensitive authentication endpoints (e.g. /login, /register, /forgot-password)
 * Enforces a maximum of 10 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP to prevent credential brute-forcing
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRedisStore('auth'),
  message: {
    error: 'Too many authentication attempts. For your security, this IP is temporarily restricted. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Global API rate limiter for standard platform requests
 * Enforces a maximum of 600 requests per 15-minute window per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRedisStore('api'),
  skip: (req) => {
    // Allow load testing / benchmark runs in development mode
    return process.env.NODE_ENV !== 'production' && req.headers['x-benchmark'] === 'true';
  },
  message: {
    error: 'Too many requests from this client. Please slow down.',
  },
});

/**
 * Strict rate limiter for public placement test submissions and checks
 * Prevents automated spam submissions, DB resource exhaustion, and scraping (max 20 requests per 15 minutes)
 */
export const placementTestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: new ResilientRedisStore('placement'),
  message: {
    error: 'Too many test requests from this network. Please wait a few minutes before trying again.',
  },
});

