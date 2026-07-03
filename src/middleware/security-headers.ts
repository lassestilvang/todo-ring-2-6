/**
 * Security Headers Middleware
 * Adds security-related headers to all responses
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Security headers configuration
 */
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // XSS protection
  'X-XSS-Protection': '1; mode=block',

  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https:",
    "connect-src 'self' wss: https:",
    "frame-ancestors 'none'",
  ].join('; '),

  // Permissions Policy
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '),

  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',

  // Cache control for sensitive pages
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }
  return response;
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const response = await handler(req);
    return addSecurityHeaders(response);
  };
}

/**
 * CORS configuration
 */
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
const CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];
const CORS_HEADERS = ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept-Version'];

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  if (origin && CORS_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', CORS_METHODS.join(', '));
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS.join(', '));
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
  }
  return response;
}

/**
 * CORS middleware
 */
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const origin = req.headers.get('origin');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 });
      return addCorsHeaders(response, origin);
    }

    const response = await handler(req);
    return addCorsHeaders(response, origin);
  };
}