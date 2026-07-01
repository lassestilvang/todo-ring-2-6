/**
 * Cache Management API
 * Provides cache statistics and control endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { serverCache, getCacheStats } from '@/lib/server-cache-enhanced';
import { withApiVersioning } from '@/lib/api-wrapper';
import { createLogger } from '@/lib/logger';

const logger = createLogger({ resource: 'cache-api' });

export const GET = withApiVersioning(async () => {
  const stats = getCacheStats();

  return {
    success: true,
    data: {
      redis: stats.redis,
      memoryEntries: stats.memoryEntries,
      registeredKeys: stats.registeredKeys,
      tags: stats.tags,
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hits / (stats.hits + stats.misses || 1),
      sets: stats.sets,
      evictions: stats.evictions,
      errors: stats.errors
    }
  };
});

export const POST = withApiVersioning(async (req: NextRequest) => {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'clear':
      await serverCache.clear();
      logger.info('Cache cleared');
      return { success: true, data: { message: 'Cache cleared' } };

    case 'reset-stats':
      serverCache.resetStats();
      logger.info('Cache stats reset');
      return { success: true, data: { message: 'Stats reset' } };

    default:
      return { success: false, error: `Unknown action: ${action}`, code: 'INVALID_ACTION' };
  }
});