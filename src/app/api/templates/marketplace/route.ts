import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTemplates, getTemplateRatings, rateTemplate } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const sortBy = searchParams.get('sortBy') || 'usage_count'; // usage_count, avg_rating, created_at
    const limit = parseInt(searchParams.get('limit') || '20');

    const templates = getTemplates(category || undefined, sortBy as any, limit);
    
    // Add rating info to each template
    const templatesWithRatings = templates.map(t => {
      const ratings = getTemplateRatings(t.id);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      return {
        ...t,
        avgRating,
        ratingCount: ratings.length,
      };
    });

    return jsonSuccess(templatesWithRatings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { templateId, rating, userId } = body;

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
