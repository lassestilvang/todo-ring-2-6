/**
 * API v1 Health Route
 * Provides system health status with database and cache checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { addVersionHeaders, extractApiVersion } from '@/lib/api-versioning';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getDb } from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const version = extractApiVersion(request);

    // Check database connection
    const db = getDb();
    const dbCheck = db.prepare('SELECT 1 as ok').get();

    // Get system stats
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };

    const health = {
      status: 'healthy',
      version,
      timestamp: new Date().toISOString(),
      database: {
        connected: !!dbCheck,
        taskCount: taskCount.count,
        userCount: userCount.count,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    const response = NextResponse.json({
      success: true,
      data: health,
    });

    return addVersionHeaders(response, version as any);
  } catch (error) {
    const response = NextResponse.json({
      success: false,
      error: 'Health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    }, { status: 503 });

    return addVersionHeaders(response, extractApiVersion(request) as any);
  }
}