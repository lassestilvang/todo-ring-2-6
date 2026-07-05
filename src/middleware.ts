import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limiter';
import { addSecurityHeaders, addCorsHeaders } from './middleware/security-headers';

// Protected API routes that require authentication
const PROTECTED_ROUTES = [
  '/api/tasks',
  '/api/lists',
  '/api/labels',
  '/api/subtasks',
  '/api/comments',
  '/api/sharing',
  '/api/export',
  '/api/analytics',
  '/api/v1/tasks',
  '/api/v1/lists',
  '/api/v1/labels',
  '/api/v1/subtasks',
  '/api/v1/comments',
  '/api/v1/sharing',
  '/api/v1/export',
  '/api/v1/analytics',
  '/api/ai',
  '/api/ai-assistant',
  '/api/calendar',
  '/api/focus-sessions',
  '/api/goals',
  '/api/habit-streaks',
  '/api/templates',
  '/api/time-blocking',
  '/api/time-entries',
  '/api/reminders',
  '/api/notifications',
  '/api/teams',
  '/api/task-batches',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/logout',
];

// API routes that get stricter rate limits
const STRICT_RATE_LIMIT_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/ai',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/ai',
];

/**
 * Get client identifier for rate limiting
 */
function getClientKey(request: NextRequest): string {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return `api:${apiKey}`;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  return `ip:${ip}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and public routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  // Skip rate limiting for static files
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Check if this is a public auth route
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Apply rate limiting to all API routes
  const isStrictRateLimit = STRICT_RATE_LIMIT_ROUTES.some(route => pathname.startsWith(route));
  const rateLimitResult = rateLimit(getClientKey(request), isStrictRateLimit ? 20 : 100);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests', code: 'RATE_LIMITED' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(rateLimitResult.reset / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.reset / 1000).toString(),
        },
      }
    );
  }

  // For protected routes, check for auth token
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  if (isProtectedRoute) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
  }

  const response = NextResponse.next();

  // Add security headers
  addSecurityHeaders(response);

  // Add CORS headers
  const origin = request.headers.get('origin');
  addCorsHeaders(response, origin);

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.reset / 1000).toString());

  // Add API version header
  response.headers.set('API-Version', 'v1');
  response.headers.set('X-API-Deprecation', 'false');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};