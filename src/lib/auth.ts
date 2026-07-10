import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

/**
 * Secure token manager using Redis for persistence
 */
class TokenManager {
  private redis: Redis;
  private readonly REVOKED_TTL = 30 * 60; // 30 minutes
  private readonly ACTIVE_TTL = 15 * 60;  // 15 minutes

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    });
  }

  /**
   * Generate new token pair and store in Redis
   * @param userId - Associated user ID
   * @returns {Promise<{accessToken: string, refreshToken: string}>}
   */
  async generateTokens(userId: string): Promise<{ accessToken: string, refreshToken: string }> {
    // Generate unique tokens
    const refreshToken = uuidv4();
    const accessToken = uuidv4();

    // Store in Redis with proper TTL
    const pipe = this.redis.pipeline();
    pipe.zadd(`tokens:${userId}`, Date.now(), refreshToken);
    pipe.zadd(`active:tokens`, Date.now(), refreshToken);
    pipe.expire(`tokens:${userId}`, this.ACTIVE_TTL);
    pipe.expire(`active:tokens`, this.ACTIVE_TTL);
    await pipe.exec();

    return { accessToken, refreshToken };
  }

  /**
   * Revoke a specific token
   * @param token - Token to revoke
   * @returns {Promise<boolean>} - Whether revocation was successful
   */
  async revokeToken(token: string): Promise<boolean> {
    // Remove from active tokens
    const removedFromActive = await this.redis.zrem(`active:tokens`, token);

    // Add to revoked tokens set with TTL
    await this.redis.zadd(`revoked:tokens`, Date.now() + this.REVOKED_TTL, token);
    await this.redis.expire(`revoked:tokens`, this.REVOKED_TTL);

    return removedFromActive > 0;
  }

  /**
   * Check if a token has been revoked
   * @param token - Token to check
   * @returns {Promise<boolean>}
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    const revokedMembers = await this.redis.zrange(`revoked:tokens`, 0, -1);
    return revokedMembers.includes(token);
  }

  /**
   * Remove all tokens for a user (used in revocation endpoint)
   */
  private async revokeAllTokens(userId: string): Promise<number> {
    const activeKeys = await this.redis.keys(`tokens:${userId}.*`);
    const count = await this.redis.del(...activeKeys);
    return count;
  }
}

/**
 * Secure token revocation endpoint
 * POST /api/v1/auth/revoke-token
 */
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Missing userId' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const revocationCount = await tokenManager.revokeAllTokens(userId);
    return new Response(JSON.stringify({ success: true, revokedCount }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Revocation error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Token manager instance for auth endpoint
const tokenManager = new TokenManager();