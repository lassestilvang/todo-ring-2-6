import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const db = getDb();
    const { id } = params;

    const result = db.prepare(`
      SELECT
        COALESCE(AVG(rating), 0) as avgRating,
        COUNT(*) as ratingCount
      FROM template_ratings
      WHERE template_id = ?
    `).get(id) as { avgRating: number; ratingCount: number };

    return jsonSuccess({
      templateId: id,
      avgRating: result.avgRating || 0,
      ratingCount: result.ratingCount || 0,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch ratings';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await _req.json();
    const { id } = params;
    const { rating, userId, userName } = body;

    if (!rating || rating < 1 || rating > 5) {
      return jsonError('Rating must be between 1 and 5', 400, 'INVALID_RATING');
    }

    const db = getDb();
    const now = new Date().toISOString();

    // Check if user already rated
    const existing = db.prepare(
      'SELECT id FROM template_ratings WHERE template_id = ? AND user_id = ?'
    ).get(id, userId) as { id: string } | undefined;

    if (existing) {
      // Update existing rating
      db.prepare(
        'UPDATE template_ratings SET rating = ?, user_name = ? WHERE id = ?'
      ).run(rating, userName, existing.id);
    } else {
      // Create new rating
      const ratingId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO template_ratings (id, template_id, rating, user_id, user_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(ratingId, id, rating, userId, userName, now);
    }

    // Recalculate average
    const result = db.prepare(`
      SELECT
        COALESCE(AVG(rating), 0) as avgRating,
        COUNT(*) as ratingCount
      FROM template_ratings
      WHERE template_id = ?
    `).get(id) as { avgRating: number; ratingCount: number };

    return jsonSuccess({
      templateId: id,
      avgRating: result.avgRating,
      ratingCount: result.ratingCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save rating';
    return jsonError(message, 500, 'SAVE_ERROR');
  }
}