import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { getAIMonitoringService } from '@/lib/monitoring/ai-monitoring.service';
import { z } from 'zod';

const FeedbackSchema = z.object({
  interactionId: z.string().uuid(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
  feedbackText: z.string().optional(),
  wasHelpful: z.boolean().optional(),
});

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = FeedbackSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { interactionId, userId, rating, feedbackText, wasHelpful } = validated.data;

    const result = await getAIMonitoringService().logUserFeedback({
      interactionId,
      userId,
      rating,
      feedbackText,
      wasHelpful
    });

    if (!result.success) {
      return jsonError(result.error || 'Failed to log feedback', 500);
    }

    return jsonSuccess({ message: 'Feedback recorded successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to record feedback';
    return jsonError(message, 500, 'FEEDBACK_ERROR');
  }
}

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');
    const days = parseInt(searchParams.get('days') || '7');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const metrics = await getAIMonitoringService().getPerformanceMetrics({ userId, days });
    return jsonSuccess(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get metrics';
    return jsonError(message, 500, 'METRICS_ERROR');
  }
}