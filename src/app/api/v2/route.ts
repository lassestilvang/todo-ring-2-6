/**
 * API v2 Router
 * Provides enhanced features and improved response format
 */

import { NextRequest, NextResponse } from 'next/server';
import { addVersionHeaders } from '@/lib/api-versioning';

// Version info endpoint
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.json({
    success: true,
    data: {
      version: 'v2',
      description: 'TaskPlanner API v2 with enhanced features',
      endpoints: {
        tasks: '/api/v2/tasks',
        lists: '/api/v2/lists',
        analytics: '/api/v2/analytics',
        // ... more endpoints
      },
    },
  });

  return addVersionHeaders(response, 'v2');
}