/**
 * API Versioning Middleware
 * Supports versioned API routes with backward compatibility
 */

import { NextRequest, NextResponse } from 'next/server';

// Supported API versions
export const SUPPORTED_VERSIONS = ['v1', 'v2'] as const;
export const DEFAULT_VERSION = 'v1' as const;
export const LATEST_VERSION = 'v2' as const;
export type ApiVersion = typeof DEFAULT_VERSION | typeof LATEST_VERSION;

/**
 * Extract API version from request
 * Priority: header > path prefix > default
 */
export function extractApiVersion(req: NextRequest): ApiVersion {
  // Check Accept-Version header first
  const versionHeader = req.headers.get('Accept-Version');
  if (versionHeader && SUPPORTED_VERSIONS.includes(versionHeader as ApiVersion)) {
    return versionHeader as ApiVersion;
  }

  // Check path prefix
  const path = req.nextUrl.pathname;
  const pathMatch = path.match(/^\/api\/(v\d+)\//);
  if (pathMatch && SUPPORTED_VERSIONS.includes(pathMatch[1] as ApiVersion)) {
    return pathMatch[1] as ApiVersion;
  }

  return DEFAULT_VERSION;
}

/**
 * Strip version prefix from path
 */
export function stripVersionPrefix(pathname: string): string {
  const match = pathname.match(/^\/api\/(v\d+)\/(.*)$/);
  return match ? `/${match[2]}` : pathname;
}

/**
 * Version mapping for backward compatibility
 * Maps older versions to their latest equivalents
 */
export const VERSION_MIGRATIONS: Record<string, string> = {
  'v1': 'v2', // v1 maps to v2 with deprecation warning
};

/**
 * Deprecation timeline for API versions
 */
export const DEPRECATION_TIMELINE = {
  'v1': {
    deprecated: '2025-01-01',
    sunset: '2025-12-31',
    migrationGuide: '/docs/migration/v1-to-v2',
  },
} as const;

/**
 * Get deprecation info for a version
 */
export function getDeprecationInfo(version: ApiVersion): { deprecated: string; sunset: string; migrationGuide: string } | null {
  return DEPRECATION_TIMELINE[version as keyof typeof DEPRECATION_TIMELINE] || null;
}

/**
 * Add version headers to response
 */
export function addVersionHeaders(response: NextResponse, version: ApiVersion): NextResponse {
  response.headers.set('API-Version', version);
  response.headers.set('X-API-Deprecation', 'false');

  if (version !== LATEST_VERSION) {
    response.headers.set('X-API-Deprecation', 'true');
    response.headers.set('X-API-Deprecation-Date', '2025-12-31');
    response.headers.set('X-API-Migration-Guide', `/docs/migration/${version}-to-${LATEST_VERSION}`);
  }

  return response;
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  return version !== LATEST_VERSION;
}

/**
 * Wrap handler with versioning support
 */
export function withVersioning(
  handler: (req: NextRequest, version: ApiVersion) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const version = extractApiVersion(req);
    const response = await handler(req, version);
    return addVersionHeaders(response, version);
  };
}