/**
 * AI Analytics API Route
 * Provides AI-powered insights and predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeProductivity, getProductivityPatterns, generateTaskSuggestions, predictCompletionTime } from '@/services/ai-analytics-service';
import { withApiVersioning } from '@/lib/api-wrapper';

export const GET = withApiVersioning(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const userId = req.headers.get('x-user-id') || 'demo-user';
  const type = searchParams.get('type') || 'insights';
  const taskId = searchParams.get('taskId') || undefined;

  switch (type) {
    case 'insights':
      const insights = analyzeProductivity(userId);
      return { success: true, data: insights };

    case 'patterns':
      const patterns = getProductivityPatterns(userId);
      return { success: true, data: patterns };

    case 'suggestions':
      const count = parseInt(searchParams.get('count') || '3');
      const suggestions = generateTaskSuggestions(userId, count);
      return { success: true, data: suggestions };

    case 'prediction':
      if (!taskId) {
        return { success: false, error: 'taskId is required for prediction', code: 'MISSING_TASK_ID' };
      }
      const prediction = predictCompletionTime(userId, taskId);
      return { success: true, data: prediction };

    default:
      return { success: false, error: `Unknown type: ${type}`, code: 'INVALID_TYPE' };
  }
});