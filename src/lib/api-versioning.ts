/**
 * API Versioning Middleware
 * Supports versioned API routes with backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ApiVersion {
  version: string;
  basePath: string;
  deprecated: boolean;
  deprecationDate?: string;
}

// Supported API versions
export const SUPPORTED_VERSIONS = ['v1', 'v2'];
export const DEFAULT_VERSION = 'v1';
export const LATEST_VERSION = 'v2';

/**
 * Extract API version from request
 * Priority: header > path prefix > default
 */
export function extractApiVersion(req: NextRequest): string {
  // Check Accept-Version header first
  const versionHeader = req.headers.get('Accept-Version');
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader)) {
    return versionHeader;
  }

  // Check path prefix
  const path = req.nextUrl.pathname;
  const pathMatch = path.match(/^\/api\/(v\d+)\//);
  if (pathMatch && SUPPORTED_VERSIONS.includes(pathMatch[1])) {
    return pathMatch[1];
  }

  return DEFAULT_VERSION;
}

/**
 * Version mapping for backward compatibility
 */
export const VERSION_MIGRATIONS: Record<string, string> = {
  'v1': 'v2', // v1 maps to v2 with deprecation warning
};

/**
 * Add version headers to response
 */
export function addVersionHeaders(response: NextResponse, version: string): void {
  response.headers.set('API-Version', version);
  response.headers.set('X-API-Deprecation', 'false');

  if (version !== LATEST_VERSION) {
    response.headers.set('X-API-Deprecation', 'true');
    response.headers.set('X-API-Deprecation-Date', '2025-12-31');
    response.headers.set('X-API-Migration-Guide', `/docs/migration/${version}-to-${LATEST_VERSION}`);
  }
}

/**
 * Wrap handler with versioning support
 */
export function withVersioning(
  handler: (req: NextRequest, version: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const version = extractApiVersion(req);
    const response = await handler(req, version);
    addVersionHeaders(response, version);
    return response;
  };
}