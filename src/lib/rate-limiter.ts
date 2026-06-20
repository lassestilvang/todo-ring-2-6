/**
 * Rate limiting utility
 * Uses in-memory store (for production, use Redis)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};
const DEFAULT_WINDOW = 60_000; // 1 minute
const DEFAULT_LIMIT = 100;

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check if a request should be rate limited
 */
export function rateLimit(
  key: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW
): RateLimitResult {
  const now = Date.now();
  const resetTime = now + windowMs;

  // Get or create entry
  let entry = store[key];
  if (!entry || entry.resetTime < now) {
    entry = { count: 0, resetTime };
    store[key] = entry;
  }

  // Check limit
  if (entry.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Middleware for rate limiting API routes
 */
export function withRateLimit(
  handler: (req: Request | any) => Promise<Response>,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW
) {
  return async (req: Request | any): Promise<Response> => {
    // Get client identifier (IP or API key)
    const clientKey = getClientKey(req);

    const result = rateLimit(clientKey, limit, windowMs);

    if (!result.success) {
      const response = new Response(
        JSON.stringify({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMITED',
        })
      );
      response.headers.set('Retry-After', Math.ceil(result.reset / 1000).toString());
      response.headers.set('X-RateLimit-Limit', result.limit.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', Math.ceil(result.reset / 1000).toString());
      return response;
    }

    const response = await handler(req);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(result.reset / 1000).toString());

    return response;
  };
}

function getClientKey(req: Request | any): string {
  // Try to get from headers
  const apiKey = req.headers?.get?.('x-api-key') || req.headers?.['x-api-key'];
  if (apiKey) return `api:${apiKey}`;

  // Get IP address
  const ip = req.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers?.get?.('x-real-ip') ||
             'unknown';

  return `ip:${ip}`;
}

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of Object.entries(store)) {
    if (entry.resetTime < now) {
      delete store[key];
    }
  }
}, 60_000);