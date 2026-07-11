import { Redis } from 'ioredis';

// Redis cache instance
const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD
});

// Cache TTL settings in seconds
const CACHE_TTL = {
  tasks: 300,    // 5 minutes
  templates: 3600, // 1 hour
  stats: 86400    // 1 day
};

// Caching utility
export class CacheService {
  /**
   * Set item in cache
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds
   */
  async set(key: string, value: any, ttl = CACHE_TTL.tasks) {
    await redisClient.setex(key, ttl, JSON.stringify(value));
  }

  /**
   * Get item from cache
   *
   * @param key - Cache key
   * @returns - Cached value or null if not found
   */
  async get(key: string) {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Delete item from cache
   *
   * @param key - Cache key to invalidate
   */
  async delete(key: string) {
    await redisClient.del(key);
  }

  /**
   * Generate cache key with user and endpoint
   *
   * @param endpoint - API endpoint name
   * @param userId - User ID
   * @param params - Query parameters
   * @returns - Unique cache key
   */
  generateKey(endpoint: string, userId?: string, params?: any) {
    let key = `cache:${endpoint}`;
    if (userId) key += `:${userId}`;
    if (params) {
      const paramString = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      key += `:${paramString}`;
    }
    return key;
  }
}

export const cacheService = new CacheService();