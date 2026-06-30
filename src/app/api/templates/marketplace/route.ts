import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTemplates, getTemplateRatings, rateTemplate, getUserTemplateRating } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sortBy') || 'usage_count'; // usage_count, avg_rating, created_at
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = _req.headers.get('x-user-id');

    const templates = getTemplates(category || undefined, sortBy as 'usage_count' | 'avg_rating' | 'created_at' | 'name', limit);

    // Add rating info to each template
    const templatesWithRatings = await Promise.all(templates.map(async t => {
      const templateId = t.id || '';
      const ratings = getTemplateRatings(templateId);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      // Get user's rating if logged in
      let userRating = null;
      if (userId) {
        userRating = await getUserTemplateRating(templateId, userId);
      }

      return {
        ...t,
        avgRating,
        ratingCount: ratings.length,
        userRating,
      };
    }));

    return jsonSuccess(templatesWithRatings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { templateId, rating } = body;

    if (!templateId || !rating) {
      return jsonError('templateId and rating are required', 400, 'MISSING_PARAMS');
    }

    if (rating < 1 || rating > 5) {
      return jsonError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
    }

    const templateRating = rateTemplate(templateId, rating);
    return jsonSuccess(templateRating, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to rate template';
    return jsonError(message, 500, 'RATING_ERROR');
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const templateId = searchParams.get('id');
    const userId = _req.headers.get('x-user-id');

    const body = await _req.json();
    const { rating } = body;

    if (!templateId || !rating) {
      return jsonError('templateId and rating are required', 400, 'MISSING_PARAMS');
    }

    if (rating < 1 || rating > 5) {
      return jsonError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
    }

    if (!userId) {
      return jsonError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const templateRating = await rateTemplate(templateId, rating, userId);
    return jsonSuccess(templateRating);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to rate template';
    return jsonError(message, 500, 'RATING_ERROR');
  }
}
