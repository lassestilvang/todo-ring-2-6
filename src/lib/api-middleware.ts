/**
 * API Middleware utilities
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from './rate-limiter';
import { sanitizeObject } from './sanitize';
import { jsonError, jsonValidationError, ErrorCodes, ErrorCode, ApiResponse } from './api-response';
import { verifyJwt } from './jwt';
import { extractApiVersion } from './api-versioning';
import { ApiError, getErrorMessage } from './error-codes';

export interface MiddlewareResult {
  shouldProceed: boolean;
  response?: NextResponse;
}

export interface ApiContext {
  user?: { id: string; email: string; name?: string };
  params?: Record<string, string>;
  version?: string;
}

export type ApiHandler<T = any> = (
  request: NextRequest,
  context: ApiContext
) => Promise<T | NextResponse> | T | Promise<NextResponse>;

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
          code: ErrorCodes.RATE_LIMITED,
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
          { success: false, error: 'Invalid JSON', code: 'VAL_BAD_REQUEST' },
          { status: 400 }
        );
      }
    }

    return handler(req, sanitizedBody as T);
  };
}

// ============================================================================
// Enhanced middleware with authentication and context
// ============================================================================

/**
 * Create API middleware with configuration
 */
export function createApiMiddleware(config: { requireAuth?: boolean; validateVersion?: boolean } = {}) {
  return async (
    request: NextRequest,
    handler: ApiHandler
  ): Promise<NextResponse> => {
    const context: ApiContext = {};

    try {
      // Extract version
      if (config.validateVersion) {
        context.version = extractApiVersion(request);
      }

      // Authentication
      if (config.requireAuth) {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
          return NextResponse.json(
            new ApiError(ErrorCodes.UNAUTHORIZED, getErrorMessage(ErrorCodes.UNAUTHORIZED), 401).toJSON(),
            { status: 401 }
          );
        }

        try {
          const decoded = await verifyJwt(token);
          context.user = {
            id: decoded.sub,
            email: decoded.email,
            name: decoded.name,
          };
        } catch (error) {
          return NextResponse.json(
            new ApiError(ErrorCodes.INVALID_TOKEN, getErrorMessage(ErrorCodes.INVALID_TOKEN), 401).toJSON(),
            { status: 401 }
          );
        }
      }

      // Execute handler
      const result = await handler(request, context);

      // If result is already a NextResponse, return it
      if (result instanceof NextResponse) {
        return result;
      }

      // Wrap successful result
      return NextResponse.json<ApiResponse>({ success: true, data: result });
    } catch (error) {
      // Handle ApiError instances
      if (error instanceof ApiError) {
        return NextResponse.json(error.toJSON(), { status: error.statusCode });
      }

      // Handle unexpected errors
      const message = error instanceof Error ? error.message : 'Internal server error';
      console.error('API Error:', error);
      return NextResponse.json(
        new ApiError(ErrorCodes.INTERNAL_ERROR, message, 500).toJSON(),
        { status: 500 }
      );
    }
  };
}

/**
 * Convenience middleware creators
 */
export const requireAuth = createApiMiddleware({ requireAuth: true });
export const withVersion = createApiMiddleware({ validateVersion: true });
export const requireAuthAndVersion = createApiMiddleware({ requireAuth: true, validateVersion: true });

/**
 * ValidationError for validation failures
 */
export class ValidationError extends Error {
  constructor(public readonly errors: Array<{ path: (string | number)[]; message: string }>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Parse Zod errors into validation error format
 */
export function parseZodError(error: any): Array<{ path: (string | number)[]; message: string }> {
  return error.errors?.map((e: any) => ({
    path: e.path,
    message: e.message,
  })) || [{ path: [], message: 'Validation failed' }];
}