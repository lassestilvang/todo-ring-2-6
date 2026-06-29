/**
 * CSRF Protection Utility
 * Generates and validates CSRF tokens for API requests
 */

import { randomUUID } from 'crypto';
import { jwtVerify, SignJWT } from 'jose';

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret-key-change-in-production';
const secret = new TextEncoder().encode(CSRF_SECRET);

export interface CSRFToken {
  token: string;
  expiresAt: string;
}

/**
 * Generate a CSRF token
 */
export async function generateCSRFToken(): Promise<CSRFToken> {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  const signedToken = await new SignJWT({ token, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  return { token: signedToken, expiresAt };
}

/**
 * Verify a CSRF token
 */
export async function verifyCSRFToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const expiresAt = payload.expiresAt as string;

    // Check if token has expired
    if (new Date(expiresAt) < new Date()) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * CSRF middleware for API routes
 */
export function csrfMiddleware(handler: Function) {
  return async (req: Request, next: any) => {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return handler(req, next);
    }

    const csrfToken = req.headers.get('x-csrf-token');

    if (!csrfToken) {
      return new Response(
        JSON.stringify({ error: 'CSRF token missing', code: 'CSRF_MISSING' }),
        { status: 403 }
      );
    }

    const isValid = await verifyCSRFToken(csrfToken);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token', code: 'CSRF_INVALID' }),
        { status: 403 }
      );
    }

    return handler(req, next);
  };
}