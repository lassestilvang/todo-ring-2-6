import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { verifyRefreshToken, updateRefreshToken, generateAccessToken } from '@/lib/auth-enhanced';
import { redisClient } from '@/lib/redis';

ensureDbInitialized();

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return jsonError('Refresh token required', 400, 'MISSING_TOKEN');
    }

    // Check revocation list
    const revoked = await redisClient.SISMEMBER('revoked:tokens', refreshToken);
    if (revoked) {
      return jsonError('Token has been revoked', 401, 'REVOKED_TOKEN');
    }

    // Verify token
    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      return jsonError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    // Update token in Redis
    const newRefreshToken = await updateRefreshToken(userId);
    await redisClient.SADD('active:tokens', newRefreshToken);
    await redisClient.SADD('revoked:tokens', refreshToken);
    await redisClient.EXPIRE('active:tokens', 1200); // 20 minutes TTL

    // Generate tokens
    const accessToken = await generateAccessToken(userId);
    const newRefreshToken = await generateRefreshToken(userId);

    return jsonSuccess({
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    return jsonError(message, 500, 'REFRESH_ERROR');
  }
}