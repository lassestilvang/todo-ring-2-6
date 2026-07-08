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

// Global cache registry for pattern invalidation
const globalCacheRegistry = new Set<string>();

// In-memory cache
const cache = new Map<string, CacheEntry<any>>();

// Try to use Redis if available - now with BullMQ queue integration
let redis: any = null;
let redisConnected = false;

// Task-specific Redis client for background sync conflict resolution
let taskSyncRedis: any = null;

// Only attempt Redis connection on server-side with REDIS_URL configured
if (typeof window === 'undefined' && process.env.REDIS_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const redisClient = require('redis');
    // Main cache client
    redis = redisClient.createClient({ url: process.env.REDIS_URL });
    redis.on('error', () => {
      console.warn('Redis connection failed, falling back to memory cache');
      redis = null;
      redisConnected = false;
    });
    // Connect to Redis
    redis.connect().then(() => {
      redisConnected = true;
      console.log('Redis cache connected');
    }).catch(() => {
      redis = null;
      redisConnected = false;
    });

    // Task sync Redis client for conflict resolution
    taskSyncRedis = redisClient.createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 5000)
      }
    });
    taskSyncRedis.on('error', (error: Error) => {
      console.warn('Task sync Redis error:', error.message);
    });
  } catch {
    // Redis not available, use memory cache
    // Install 'redis' package for production Redis support
  }
}

/**
 * Task synchronization conflict resolver
 * Uses Redis for distributed locking during concurrent operations
 */
export class TaskSyncConflictResolver {
  private redisClient: any;

  constructor() {
    this.redisClient = taskSyncRedis;
  }

  /**
   * Acquire a lock for task modification
   * Prevents concurrent edits on the same task
   */
  async acquireLock(taskId: string, userId: string, timeoutMs: number = 5000): Promise<boolean> {
    if (!this.redisClient || !redisConnected) {
      // No Redis, allow operation (optimistic locking)
      return true;
    }

    try {
      const lockKey = `task_lock:${taskId}`;
      const lockValue = `${userId}:${Date.now()}`;
      const acquired = await this.redisClient.set(lockKey, lockValue, {
        NX: true,
        PX: timeoutMs
      });
      return acquired === 'OK';
    } catch (error) {
      console.error('Failed to acquire task lock:', error);
      return true; // Allow operation on error
    }
  }

  /**
   * Release task lock
   */
  async releaseLock(taskId: string, userId: string): Promise<void> {
    if (!this.redisClient || !redisConnected) return;

    try {
      const lockKey = `task_lock:${taskId}`;
      const lockValue = await this.redisClient.get(lockKey);
      if (lockValue && lockValue.startsWith(`${userId}:`)) {
        await this.redisClient.del(lockKey);
      }
    } catch (error) {
      console.error('Failed to release task lock:', error);
    }
  }

  /**
   * Get task version from cache to detect conflicts
   */
  async getVersion(taskId: string): Promise<number> {
    if (!this.redisClient || !redisConnected) return 0;

    try {
      const version = await this.redisClient.get(`task_version:${taskId}`);
      return version ? parseInt(version, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Increment task version atomically
   */
  async incrementVersion(taskId: string): Promise<number> {
    if (!this.redisClient || !redisConnected) return 1;

    try {
      return (await this.redisClient.incr(`task_version:${taskId}`)) as number;
    } catch {
      return 1;
    }
  }

  /**
   * Check if operation conflicts with pending operations
   */
  async hasPendingOps(taskId: string, clientVersion: number): Promise<boolean> {
    if (!this.redisClient || !redisConnected) return false;

    try {
      const pendingCount = await this.redisClient.lLen(`task_pending_ops:${taskId}`);
      return (pendingCount || 0) > 0 && (await this.getVersion(taskId)) !== clientVersion;
    } catch {
      return false;
    }
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

/**
 * Cache warming - pre-populate cache with frequently accessed data
 * Call this on server startup or periodically
 */
export async function warmCache(): Promise<void> {
  // Warm popular task views
  const popularViews = ['today', 'next7', 'upcoming'];
  for (const view of popularViews) {
    try {
      // Note: This should be called from a server context with proper API access
      // For now, we just set up the cache keys
      console.log(`Cache warming for view ${view} should be done via API call`);
    } catch (error) {
      console.warn(`Failed to warm cache for view ${view}`);
    }
  }
}

/**
 * Invalidate cache keys matching a pattern
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = Array.from(globalCacheRegistry).filter((k) => k.includes(pattern));
  for (const key of keys) {
    await serverCache.del(key);
    globalCacheRegistry.delete(key);
  }
}

/**
 * Register a cache key for pattern-based invalidation
 */
export function registerCacheKey(key: string): void {
  globalCacheRegistry.add(key);
}

/**
 * Invalidate all cache for a specific user
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    invalidatePattern(`tasks:user:${userId}`),
    invalidatePattern(`dashboard:${userId}`),
    invalidatePattern(`user:${userId}`),
  ]);
}

/**
 * Invalidate cache for a specific task
 */
export async function invalidateTaskCache(taskId: string): Promise<void> {
  await Promise.all([
    serverCache.del(`task:detail:${taskId}`),
    invalidatePattern(`tasks:user:`),
  ]);
}

/**
 * Invalidate cache for a list
 */
export async function invalidateListCache(listId: string): Promise<void> {
  await invalidatePattern(`list:${listId}`);
}

/**
 * Cache tags for dependency-based invalidation
 */
export const CacheTags = {
  USER_TASKS: (userId: string) => `user:${userId}:tasks`,
  USER_LISTS: (userId: string) => `user:${userId}:lists`,
  TASK_DETAIL: (taskId: string) => `task:${taskId}`,
  LIST_TASKS: (listId: string) => `list:${listId}:tasks`,
  TEAM_WORKLOAD: (teamId: string) => `team:${teamId}:workload`,
  DASHBOARD_STATS: (userId: string) => `dashboard:stats:${userId}`,
};

/**
 * Dashboard-specific cache utilities
 */
export const DashboardCache = {
  // Task analytics cache keys
  taskAnalytics: (userId: string, period: string) => `dashboard:analytics:tasks:${userId}:${period}`,
  userStats: (userId: string) => `dashboard:stats:user:${userId}`,
  quickStats: (userId: string) => `dashboard:quickstats:${userId}`,
  productivity: (userId: string, range: string) => `dashboard:productivity:${userId}:${range}`,

  // Cache common dashboard data
  async cacheDashboardData(userId: string, data: any, ttlSeconds: number = 300): Promise<void> {
    await Promise.all([
      serverCache.set(this.quickStats(userId), data.quickStats, { ttlSeconds }),
      serverCache.set(this.userStats(userId), data.userStats, { ttlSeconds }),
    ]);
  },

  // Invalidate all dashboard cache for a user
  async invalidateUserDashboard(userId: string): Promise<void> {
    await invalidatePattern(`dashboard:${userId}`);
  }
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
    await serverCache.set(key, tasks, { ttlSeconds: 120 });
  },

  async invalidateUserTasks(userId: string): Promise<void> {
    await invalidatePattern(`tasks:user:${userId}`);
  }
};