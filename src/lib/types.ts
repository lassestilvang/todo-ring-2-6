/**
 * Shared type definitions for rate limiting utilities
 */

import { Request, Response } from 'express';

export interface RateLimitOptions {
  /** Unique key for rate limiting (defaults to IP-based) */
  key?: string;
  /** Maximum requests allowed in window */
  limit?: number;
  /** Time window in milliseconds */
  windowMs?: number;
  /** Custom key generator function */
  keyGenerator?: (req: Request) => string;
  /** Redis URL for distributed rate limiting */
  redisUrl?: string | undefined;
  /** Prefix for Redis keys */
  storePrefix?: string;
  /** Skip rate limiting for certain requests */
  skip?: (req: Request) => boolean;
  /** Standard headers to include in responses */
  standardHeaders?: boolean;
  /** Legacy headers to include in responses */
  legacyHeaders?: boolean;
  /** Handler to be executed after rate limiting */
  handler?: (req: Request) => Promise<Response>;
  /** Security headers to include in responses */
  securityHeaders?: {
    csp?: string;
    hsts?: string;
    ['x-content-type-options']?: string;
    ['x-frame-options']?: string;
    ['x-permissions-policy']?: string;
  };
}

export interface RateLimitOptionsExtended extends Omit<RateLimitOptions, 'key'> {
  /** Additional security headers to include in responses */
  securityHeaders?: {
    csp?: string;
    hsts?: string;
    ['x-content-type-options']?: string;
    ['x-frame-options']?: string;
    ['x-permissions-policy']?: string;
  };
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
  xRateLimitLimit?: number;
  xRateLimitRemaining?: number;
  xRateLimitReset?: number;
  cspReport?: string;
}

export interface RateLimitStore {
  increment: (key: string, limit: number, windowMs?: number) => Promise<{ success: boolean; remaining: number; reset: number }>;
  resetKey?: (key: string) => Promise<void>;
  resetAll?: () => Promise<void>;
}