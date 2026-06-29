import { NextRequest } from 'next/server';
import type { RateLimitConfig, RateLimitResult } from '@/types/middleware';

/**
 * In-memory rate limiter for AI endpoints
 * Uses sliding window algorithm for precise per-IP tracking
 */
class RateLimiter {
  private requests = new Map<string, number[]>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }) {
    this.config = config;
  }

  /**
   * Check if request is allowed and record it
   */
  check(ip: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Clean old requests outside the window
    const existing = this.requests.get(ip) || [];
    const recent = existing.filter(timestamp => timestamp > windowStart);

    // Check limit
    if (recent.length >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowStart + this.config.windowMs
      };
    }

    // Record this request
    recent.push(now);
    this.requests.set(ip, recent);

    return {
      allowed: true,
      remaining: this.config.maxRequests - recent.length,
      resetAt: now + this.config.windowMs
    };
  }

  /**
   * Get headers for rate limit response
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': String(this.config.maxRequests),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000))
    };
  }
}

// Default instances
const defaultRateLimiter = new RateLimiter();
const aiRateLimiter = new RateLimiter({ windowMs: 60000, maxRequests: 50 });

/**
 * Rate limiting middleware wrapper
 */
export function withRateLimit(rateLimiter: RateLimiter = defaultRateLimiter) {
  return function(req: NextRequest, handler: Function) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               'unknown';

    const result = rateLimiter.check(ip);

    if (!result.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Too many requests',
        code: 'RATE_LIMITED'
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...rateLimiter.getHeaders(result)
        }
      });
    }

    // Add rate limit headers to successful responses
    const response = handler(req) as any;
    if (response instanceof Response) {
      response.headers = {
        ...Object.fromEntries(response.headers.entries()),
        ...rateLimiter.getHeaders(result)
      };
    }

    return response;
  };
}

export { defaultRateLimiter, aiRateLimiter };