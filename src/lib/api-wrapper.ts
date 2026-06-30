/**
 * API Wrapper for Versioned Endpoints
 * Provides backward compatibility and version-specific handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractApiVersion, addVersionHeaders, SUPPORTED_VERSIONS, DEFAULT_VERSION } from './api-versioning';

/**
 * Version-specific response transformer
 */
export interface VersionTransformers {
  v1?: (data: any) => any;
  v2?: (data: any) => any;
}

/**
 * Wrap API handler with versioning support
 * Automatically handles version extraction and response headers
 */
export function createVersionedHandler<T = any>(
  handler: (req: NextRequest, version: string) => Promise<{ success: boolean; data?: T; error?: string; code?: string }>,
  transformers?: VersionTransformers
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const version = extractApiVersion(req);

    try {
      const result = await handler(req, version);

      // Apply version-specific transformation
      let data = result.data;
      if (transformers?.[version as keyof VersionTransformers]) {
        const transformer = transformers[version as keyof VersionTransformers] as (d: any) => any;
        data = transformer(data);
      }

      const response = NextResponse.json({
        success: result.success,
        data,
        error: result.error,
        code: result.code,
        meta: {
          version,
          timestamp: new Date().toISOString()
        }
      });

      addVersionHeaders(response, version);
      return response;
    } catch (error) {
      const response = NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          meta: { version, timestamp: new Date().toISOString() }
        },
        { status: 500 }
      );
      addVersionHeaders(response, version);
      return response;
    }
  };
}

/**
 * Legacy wrapper for existing API routes
 * Adds versioning headers without changing route structure
 */
export function withApiVersioning(handler: () => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const version = extractApiVersion(req);
    const response = await handler();
    addVersionHeaders(response, version);
    return response;
  };
}

/**
 * Create a versioned API route that supports multiple versions
 * Usage: export const GET = createVersionedRoute(handlers)</
 */
export function createVersionedRoute<T>(
  handlers: Record<string, (req: NextRequest) => Promise<{ success: boolean; data?: T; error?: string; code?: string }>>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const version = extractApiVersion(req);
    const handlerKey = version as keyof typeof handlers;
    const handler = handlers[handlerKey] || handlers[DEFAULT_VERSION];

    if (!handler) {
      return NextResponse.json(
        { success: false, error: `Unsupported API version: ${version}`, code: 'UNSUPPORTED_VERSION' },
        { status: 400 }
      );
    }

    const result = await handler(req);
    const response = NextResponse.json(result);
    addVersionHeaders(response, version);
    return response;
  };
}