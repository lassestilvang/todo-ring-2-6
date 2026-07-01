/**
 * Enhanced Server Cache with Redis support
 * Provides distributed caching, statistics, and cache warming
 */

import { NextRequest, NextResponse } from 'next/server';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  hits: number;
}

interface CacheOptions {
  ttlSeconds?: number;
  tags?: string[]; // For cache invalidation by tag
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  evictions: number;
  errors: number;
}

const DEFAULT_TTL = 60;
const MAX_ENTRIES = 10000;

// Global cache registry
const globalCacheRegistry = new Set<string>();
const tagRegistry = new Map<string, Set<string>>();

// Statistics
const stats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  evictions: 0,
  errors: 0
};

// In-memory cache (fallback)
const memoryCache = new Map<string, CacheEntry<any>>();

// Redis client (optional)
let redis: any = null;
let redisConnected = false;

// Initialize Redis if configured
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redisClient = require('redis');
    redis = redisClient.createClient({ url: process.env.REDIS_URL });
    redis.on('error', () => {
      console.warn('Redis connection failed, falling back to memory cache');
      redis = null;
      redisConnected = false;
    });
    redis.connect().then(() => {
      redisConnected = true;
      console.log('Redis cache connected');
    }).catch(() => {
      redis = null;
      redisConnected = false;
    });
  } catch {
    // Redis not available
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

  getStats(): CacheStats {
    return { ...stats };
  }

  resetStats(): void {
    Object.assign(stats, { hits: 0, misses: 0, sets: 0, evictions: 0, errors: 0 });
  }

  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();

    // Try Redis first
    if (this.redisClient) {
      try {
        const data = await this.redisClient.get(key);
        if (data) {
          stats.hits++;
          return JSON.parse(data);
        }
      } catch (error) {
        stats.errors++;
      }
    }

    // Memory cache
    const entry = memoryCache.get(key);
    if (!entry) {
      stats.misses++;
      return null;
    }

    if (now > entry.expiresAt) {
      memoryCache.delete(key);
      stats.misses++;
      return null;
    }

    stats.hits++;
    return entry.data;
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttlSeconds || DEFAULT_TTL;
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: now,
      expiresAt: now + ttl * 1000,
      hits: 0,
    };

    // Track tags
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        if (!tagRegistry.has(tag)) {
          tagRegistry.set(tag, new Set());
        }
        tagRegistry.get(tag)!.add(key);
      }
    }

    // Try Redis first
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttl, JSON.stringify(value));
        stats.sets++;
        return;
      } catch (error) {
        stats.errors++;
      }
    }

    // Memory cache
    memoryCache.set(key, entry);
    globalCacheRegistry.add(key);
    stats.sets++;

    // Cleanup old entries if cache is too large
    if (memoryCache.size > MAX_ENTRIES) {
      const entries = Array.from(memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - MAX_ENTRIES);
      for (const [k] of toDelete) {
        memoryCache.delete(k);
        globalCacheRegistry.delete(k);
        stats.evictions++;
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
    memoryCache.delete(key);
    globalCacheRegistry.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.flushall();
      } catch {
        // Ignore
      }
    }
    memoryCache.clear();
    globalCacheRegistry.clear();
    tagRegistry.clear();
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateTag(tag: string): Promise<void> {
    const keys = tagRegistry.get(tag);
    if (!keys) return;

    for (const key of keys) {
      await this.del(key);
      globalCacheRegistry.delete(key);
    }
    tagRegistry.delete(tag);
  }

  /**
   * Check if Redis is being used
   */
  isRedisConnected(): boolean {
    return redisConnected;
  }

  /**
   * Get cache health info
   */
  getHealthInfo() {
    return {
      redis: redisConnected,
      memoryEntries: memoryCache.size,
      registeredKeys: globalCacheRegistry.size,
      tags: tagRegistry.size,
      stats
    };
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

/**
 * Cache warming utility
 */
export async function warmCache(warmers: Array<{ key: string; fetcher: () => Promise<any>; ttlSeconds?: number }>): Promise<void> {
  for (const warmer of warmers) {
    try {
      const data = await warmer.fetcher();
      await serverCache.set(warmer.key, data, { ttlSeconds: warmer.ttlSeconds || 300 });
    } catch (error) {
      console.warn(`Failed to warm cache for key ${warmer.key}:`, error);
    }
  }
}

/**
 * Dashboard-specific cache utilities
 */
export const DashboardCache = {
  taskAnalytics: (userId: string, period: string) => `dashboard:analytics:tasks:${userId}:${period}`,
  userStats: (userId: string) => `dashboard:stats:user:${userId}`,
  quickStats: (userId: string) => `dashboard:quickstats:${userId}`,
  productivity: (userId: string, range: string) => `dashboard:productivity:${userId}:${range}`,

  async cacheDashboardData(userId: string, data: any, ttlSeconds: number = 300): Promise<void> {
    await Promise.all([
      serverCache.set(this.quickStats(userId), data.quickStats, { ttlSeconds, tags: ['dashboard', `user:${userId}`] }),
      serverCache.set(this.userStats(userId), data.userStats, { ttlSeconds, tags: ['dashboard', `user:${userId}`] }),
    ]);
  },

  async invalidateUserDashboard(userId: string): Promise<void> {
    await serverCache.invalidateTag(`user:${userId}`);
  },
};

/**
 * Task view cache utilities
 */
export const TaskCache = {
  view: (userId: string, viewName: string, filters: string) =>
    `tasks:${userId}:${viewName}:${filters}`,
  taskDetail: (taskId: string) => `task:detail:${taskId}`,
  userTasks: (userId: string) => `tasks:user:${userId}`,

  async cacheTasks(userId: string, viewName: string, tasks: any[], filters: string = ''): Promise<void> {
    const key = this.view(userId, viewName, filters);
    globalCacheRegistry.add(key);
    await serverCache.set(key, tasks, { ttlSeconds: 120, tags: ['tasks', `user:${userId}`] });
  },

  async invalidateUserTasks(userId: string): Promise<void> {
    await serverCache.invalidateTag(`user:${userId}`);
  }
};

/**
 * Cache API endpoint for monitoring
 */
export async function getCacheStats(req: NextRequest): Promise<NextResponse> {
  const info = serverCache.getHealthInfo();
  return NextResponse.json(info);
}