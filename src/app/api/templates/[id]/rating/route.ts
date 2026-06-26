import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

/**
 * Submit a rating for a template
 * POST /api/templates/[id]/rating
 */
export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await _req.json();
    const { rating } = body;

    if (!id) {
      return jsonError('Template ID is required', 400, 'MISSING_ID');
    }

    if (rating < 1 || rating > 5) {
      return jsonError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
    }

    const db = getDb();

    // Check if template exists
    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id);
    if (!template) {
      return jsonError('Template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    // Insert rating
    const ratingId = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO template_ratings (id, template_id, rating, created_at) VALUES (?, ?, ?, ?)'
    ).run(ratingId, id, rating, now);

    // Calculate new average rating
    const avgRating = db.prepare(
      'SELECT AVG(rating) as avg_rating FROM template_ratings WHERE template_id = ?'
    ).get(id) as { avg_rating: number };

    // Update template rating (stored as avg_rating * 20 to avoid decimals)
    db.prepare(
      'UPDATE task_templates SET avg_rating = ? WHERE id = ?'
    ).run(Math.round(avgRating.avg_rating * 20) / 20, id);

    return jsonSuccess({ rating: Math.round(avgRating.avg_rating * 20) / 20 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit rating';
    return jsonError(message, 500, 'RATING_ERROR');
  }
}