/**
 * JWT Utilities
 * Centralized JWT token creation and verification
 */

import { jwtVerify, SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || 'taskplanner-secret-key-change-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  ip?: string;
}

/**
 * Validate JWT configuration
 */
export function validateJwtConfig(): void {
  if (!process.env.JWT_SECRET && !process.env.AUTH_SECRET) {
    console.warn('[SECURITY] JWT_SECRET not configured - using insecure fallback');
  }
  if (process.env.NODE_ENV === 'production' && JWT_SECRET.includes('change')) {
    throw new Error('JWT_SECRET must be changed in production');
  }
}

/**
 * Generate a JWT token with host binding verification
 */
export async function generateJwt(
  payload: Record<string, unknown>,
  expiresIn: string = '30m',
  options?: { issuer?: string; audience?: string; bindIp?: string }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(expiresIn)
    .setIssuer(options?.issuer || process.env.NODE_ENV || 'api.taskplanner.io')
    .setAudience(options?.audience || process.env.ALLOWED_ORIGIN || 'taskplanner-app')
    .set('ip', options?.bindIp)
    .sign(secret);
}

/**
 * Verify a JWT token
 */
export async function verifyJwt(token: string): Promise<JwtPayload> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify JWT and return just the user ID (for middleware)
 */
export async function verifyJwtMinimal(token: string): Promise<{ sub: string }> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { sub: payload.sub as string };
  } catch {
    throw new Error('UNAUTHORIZED');
  }
}