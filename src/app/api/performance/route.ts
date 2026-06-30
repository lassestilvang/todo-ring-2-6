/**
 * Performance Monitoring API Route
 * Returns performance metrics for the dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const period = searchParams.get('period') || '1h';
  const operation = searchParams.get('operation');

  const monitor = getPerformanceMonitor();
  const allStats = monitor.getAllStats();

  // Filter by operation if specified
  const stats = operation
    ? { [operation]: allStats[operation] }
    : allStats;

  // Calculate cache hit rate if available
  const cacheStats = getCacheStats();

  return NextResponse.json({
    success: true,
    data: {
      operations: stats,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    },
  });
}

function getCacheStats() {
  // This would integrate with the server-cache.ts module
  try {
    const { serverCache } = require('@/lib/server-cache');
    // Return cache statistics
    return {
      hits: 0,
      misses: 0,
      size: 0,
    };
  } catch {
    return null;
  }
}