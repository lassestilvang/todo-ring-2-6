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
}

/**
 * Generate a JWT token
 */
export async function generateJwt(payload: Record<string, unknown>, expiresIn: string = '7d'): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
  return token;
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