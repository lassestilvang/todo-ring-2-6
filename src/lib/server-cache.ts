/**
 * Server-side caching utility
 * Provides in-memory caching with optional Redis support
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttlSeconds?: number; // Time to live in seconds (default: 60)
}

const DEFAULT_TTL = 60; // 60 seconds
const MAX_ENTRIES = 1000;

// In-memory cache
const cache = new Map<string, CacheEntry<any>>();

// Try to use Redis if available
let redis: any = null;
// Only attempt Redis connection on server-side with REDIS_URL configured
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redisClient = require('redis');
    redis = redisClient.createClient({ url: process.env.REDIS_URL });
    redis.on('error', () => {
      console.warn('Redis connection failed, falling back to memory cache');
      redis = null;
    });
  } catch {
    // Redis not available, use memory cache
    // Install 'redis' package for production Redis support
  }
}

export class ServerCache {
  private static instance: ServerCache;
  private redisClient: any;

  private constructor() {
    this.redisClient = redis;
  }

  static getInstance(): ServerCache {
    if (!ServerCache.instance) {
      ServerCache.instance = new ServerCache();
    }
    return ServerCache.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();

    // Try Redis first
    if (this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        if (data) {
          return JSON.parse(data);
        }
      } catch (error) {
        // Fall through to memory cache
      }
    }

    // Memory cache
    const entry = cache.get(key);
    if (!entry) return null;

    if (now > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttlSeconds || DEFAULT_TTL;
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt: now + ttl * 1000,
    };

    // Try Redis first
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        return;
      } catch (error) {
        // Fall through to memory cache
      }
    }

    // Memory cache
    cache.set(key, entry);

    // Cleanup old entries if cache is too large
    if (cache.size > MAX_ENTRIES) {
      const entries = Array.from(cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - MAX_ENTRIES);
      for (const [k] of toDelete) {
        cache.delete(k);
      }
    }
  }

  async del(key: string): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch {
        // Ignore Redis errors
      }
    }
    cache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.flushall();
      } catch {
        // Ignore Redis errors
      }
    }
    cache.clear();
  }
}

export const serverCache = ServerCache.getInstance();

// Convenience functions
export async function getFromCache<T>(key: string): Promise<T | null> {
  return serverCache.get<T>(key);
}

export async function setInCache<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
  return serverCache.set(key, value, options);
}

export async function delFromCache(key: string): Promise<void> {
  return serverCache.del(key);
}