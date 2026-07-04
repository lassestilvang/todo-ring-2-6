/**
 * CSRF Protection Middleware
 * Generates and validates CSRF tokens for state-changing operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Create CSRF token cookie
 */
export function createCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Get CSRF token from request
 */
export function getCsrfToken(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER);
  if (headerToken) return headerToken;

  // Check cookie
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;
  return cookieToken || null;
}

/**
 * Validate CSRF token
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const token = getCsrfToken(request);
  if (!token) return false;

  // For GET/HEAD requests, CSRF is not required
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // For state-changing methods, validate token
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;
  if (!cookieToken) return false;

  // Constant-time comparison
  return constantTimeCompare(token, cookieToken);
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * CSRF protection middleware
 */
export function withCsrfProtection(
  handler: (req: NextRequest, response: NextResponse) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Validate CSRF for state-changing methods
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const isValid = await validateCsrfToken(req);
      if (!isValid) {
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'CSRF token validation failed',
            code: 'CSRF_INVALID',
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Create response and add CSRF cookie
    const response = await handler(req, new NextResponse());
    const csrfToken = generateCsrfToken();
    createCsrfCookie(response, csrfToken);

    return response;
  };
}