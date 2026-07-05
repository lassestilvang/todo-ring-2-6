/**
 * API Route Factory
 * Provides consistent middleware, validation, and response handling for all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonSuccess, jsonError, jsonValidationError } from './api-response';
import { ErrorCodes } from './error-codes';
import { extractApiVersion, addVersionHeaders } from './api-versioning';
import { rateLimit } from './rate-limiter';
import { sanitizeObject } from './sanitize';
import { verifyJwtMinimal } from './jwt';

// Re-export types
export interface ApiContext {
  user?: { id: string; email: string; name?: string };
  version?: string;
  isAuthenticated: boolean;
}

export interface ApiHandler {
  GET?: (request: NextRequest, context: ApiContext) => Promise<NextResponse | unknown>;
  POST?: (request: NextRequest, context: ApiContext, body: Record<string, unknown>) => Promise<NextResponse | unknown>;
  PUT?: (request: NextRequest, context: ApiContext, body: Record<string, unknown>) => Promise<NextResponse | unknown>;
  DELETE?: (request: NextRequest, context: ApiContext) => Promise<NextResponse | unknown>;
  PATCH?: (request: NextRequest, context: ApiContext, body: Record<string, unknown>) => Promise<NextResponse | unknown>;
}

// Client key helper
function getClientKey(request: NextRequest): string {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return `api:${apiKey}`;

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return `ip:${ip}`;
}

/**
 * Create a versioned API route handler
 */
export function createVersionedHandler(
  handler: ApiHandler,
  options: {
    requireAuth?: boolean;
    rateLimit?: number | { limit: number; windowMs: number };
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const context: ApiContext = { isAuthenticated: false };
    const version = extractApiVersion(request);
    context.version = version;

    // Apply rate limiting
    if (options.rateLimit !== undefined) {
      const rateLimitValue = typeof options.rateLimit === 'number'
        ? options.rateLimit
        : options.rateLimit.limit;

      const rateResult = rateLimit(getClientKey(request), rateLimitValue);
      if (!rateResult.success) {
        return NextResponse.json(
          { success: false, error: 'Too many requests', code: ErrorCodes.RATE_LIMITED },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(rateResult.reset / 1000).toString(),
              'X-RateLimit-Limit': rateResult.limit.toString(),
              'X-RateLimit-Remaining': rateResult.remaining.toString(),
              'X-RateLimit-Reset': Math.ceil(rateResult.reset / 1000).toString(),
            }
          }
        );
      }
    }

    // Handle authentication
    if (options.requireAuth) {
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

      if (!token) {
        const response = NextResponse.json(
          { success: false, error: 'Authentication required', code: ErrorCodes.UNAUTHORIZED },
          { status: 401 }
        );
        return addVersionHeaders(response, version);
      }

      try {
        const decoded = await verifyJwtMinimal(token);
        context.user = { id: decoded.sub, email: '' };
        context.isAuthenticated = true;
      } catch {
        const response = NextResponse.json(
          { success: false, error: 'Invalid or expired token', code: ErrorCodes.INVALID_TOKEN },
          { status: 401 }
        );
        return addVersionHeaders(response, version);
      }
    }

    // Parse request body for non-GET methods
    let body: Record<string, unknown> | undefined;
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      try {
        body = await request.json();
        body = sanitizeObject(body);
      } catch {
        const response = NextResponse.json(
          { success: false, error: 'Invalid JSON', code: ErrorCodes.VALIDATION_ERROR },
          { status: 400 }
        );
        return addVersionHeaders(response, version);
      }
    }

    try {
      let result: unknown;

      switch (request.method) {
        case 'GET':
          result = handler.GET ? await handler.GET(request, context) : undefined;
          break;
        case 'POST':
          result = handler.POST ? await handler.POST(request, context, body || {}) : undefined;
          break;
        case 'PUT':
          result = handler.PUT ? await handler.PUT(request, context, body || {}) : undefined;
          break;
        case 'DELETE':
          result = handler.DELETE ? await handler.DELETE(request, context) : undefined;
          break;
        case 'PATCH':
          result = handler.PATCH ? await handler.PATCH(request, context, body || {}) : undefined;
          break;
      }

      // If handler returned a NextResponse, use it
      if (result instanceof NextResponse) {
        return addVersionHeaders(result, version);
      }

      // Otherwise wrap in success response
      const response = NextResponse.json({ success: true, data: result });
      return addVersionHeaders(response, version);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      const response = NextResponse.json(
        { success: false, error: message, code: ErrorCodes.INTERNAL_ERROR },
        { status: 500 }
      );
      return addVersionHeaders(response, version);
    }
  };
}

/**
 * Create a handler with Zod validation
 */
export function createValidatedHandler(
  handler: ApiHandler,
  schema: z.ZodSchema,
  options?: { requireAuth?: boolean; rateLimit?: number }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Parse body for validation
    let body: Record<string, unknown> = {};
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      try {
        body = sanitizeObject(await request.json());
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON', code: ErrorCodes.INVALID_JSON },
          { status: 400 }
        );
      }

      const validated = schema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation failed',
            code: ErrorCodes.VALIDATION_ERROR,
            details: validated.error.errors.map(e => ({ path: e.path, message: e.message }))
          },
          { status: 400 }
        );
      }
    }

    // Create a modified request with validated body
    const modifiedRequest = request;
    (modifiedRequest as any).validatedBody = body;

    return createVersionedHandler(handler, options)(modifiedRequest);
  };
}