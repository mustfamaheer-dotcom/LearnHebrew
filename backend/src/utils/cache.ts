/**
 * Ultra-Fast In-Memory Cache with Promise Coalescing & Namespace Invalidation
 * Designed for High-Throughput Serverless & Node.js environments.
 * Prevents database connection exhaustion and eliminates cache stampedes.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private inFlightPromises = new Map<string, Promise<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically sweep expired keys every 60 seconds to prevent memory bloat
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.sweep();
      }, 60000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Retrieves an item from cache if present and not expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Stores an item with a time-to-live in seconds
   */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (ttlSeconds <= 0) return;
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Removes a specific key from cache
   */
  delete(key: string): void {
    this.store.delete(key);
    this.inFlightPromises.delete(key);
  }

  /**
   * Invalidates all keys that start with a given prefix (e.g. "placement-test", "packages", "analytics")
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
    for (const key of this.inFlightPromises.keys()) {
      if (key.startsWith(prefix)) {
        this.inFlightPromises.delete(key);
      }
    }
  }

  /**
   * Wrap pattern with Promise Coalescing (Single-Flight):
   * If multiple concurrent requests ask for the same missing key,
   * only ONE database query is executed, and all callers receive the shared result.
   */
  async wrap<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Check if another request is already fetching this exact key
    const existingPromise = this.inFlightPromises.get(key);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    // Execute the fetcher and register in-flight promise
    const promise = (async () => {
      try {
        const result = await fetcher();
        this.set(key, result, ttlSeconds);
        return result;
      } finally {
        this.inFlightPromises.delete(key);
      }
    })();

    this.inFlightPromises.set(key, promise);
    return promise;
  }

  /**
   * Clears all expired entries
   */
  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Returns current cache statistics
   */
  stats() {
    return {
      size: this.store.size,
      inFlight: this.inFlightPromises.size,
    };
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
    this.inFlightPromises.clear();
  }
}

export const cache = new MemoryCache();
