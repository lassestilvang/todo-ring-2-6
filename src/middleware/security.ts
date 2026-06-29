import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Rate limiting store (in-memory for simplicity, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = 100; // requests per window
const WINDOW_MS = 60 * 1000; // 1 minute

export function securityHeaders(request: NextRequest, response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  );

  return response;
}

export function rateLimit(request: NextRequest): NextResponse | null {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();

  const record = rateLimitStore.get(key);
  if (!record) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  if (record.count >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  record.count++;
  return null;
}

export function sanitizeInput(value: unknown): string {
  if (typeof value === 'string') {
    return value.replace(/[<>]/g, '');
  }
  return String(value);
}