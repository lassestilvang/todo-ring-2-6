/**
 * API Middleware utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rate-limiter';
import { sanitizeObject } from './sanitize';

export interface MiddlewareResult {
  shouldProceed: boolean;
  response?: NextResponse;
}

/**
 * Apply rate limiting to API requests
 */
export function applyRateLimit(
  req: NextRequest,
  limit: number = 100,
  windowMs: number = 60_000
): MiddlewareResult {
  const clientKey = getClientKey(req);
  const result = rateLimit(clientKey, limit, windowMs);

  if (!result.success) {
    return {
      shouldProceed: false,
      response: NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMITED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(result.reset / 1000).toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
          },
        }
      ),
    };
  }

  return { shouldProceed: true };
}

/**
 * Sanitize request body
 */
export function sanitizeBody(body: Record<string, any>): Record<string, any> {
  return sanitizeObject(body);
}

/**
 * Get client identifier for rate limiting
 */
function getClientKey(req: NextRequest): string {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) return `api:${apiKey}`;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  return `ip:${ip}`;
}

/**
 * Combined middleware wrapper
 */
export function withMiddleware<T = any>(
  handler: (req: NextRequest, sanitizedBody: T) => Promise<NextResponse>,
  options: {
    rateLimit?: number | { limit: number; windowMs: number };
    sanitize?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Rate limiting
    if (options.rateLimit !== undefined) {
      const rateLimitValue = typeof options.rateLimit === 'number'
        ? options.rateLimit
        : options.rateLimit.limit;
      const windowMs = typeof options.rateLimit === 'number'
        ? 60_000
        : options.rateLimit.windowMs;

      const rateResult = applyRateLimit(req, rateLimitValue, windowMs);
      if (!rateResult.shouldProceed) {
        return rateResult.response!;
      }
    }

    // Parse and sanitize body
    let sanitizedBody: Record<string, any> | undefined;
    if (options.sanitize && req.method !== 'GET') {
      try {
        const body = await req.json();
        sanitizedBody = sanitizeObject(body);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
    }

    return handler(req, sanitizedBody as T);
  };
}