import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { verifyRefreshToken, generateAccessToken } from '@/lib/auth-enhanced';

ensureDbInitialized();

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return jsonError('Refresh token required', 400, 'MISSING_TOKEN');
    }

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken);
    if (!userId) {
      return jsonError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }

    // Generate new access token
    const accessToken = await generateAccessToken(userId);

    return jsonSuccess({ accessToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to refresh token';
    return jsonError(message, 500, 'REFRESH_ERROR');
  }
}