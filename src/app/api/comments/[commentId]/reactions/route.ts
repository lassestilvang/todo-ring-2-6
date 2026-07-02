import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

/**
 * GET /api/comments/[commentId]/reactions
 * Get all reactions for a comment
 */
export async function GET(
  _req: NextRequest,
  context: { params: { commentId: string } }
) {
  try {
    const db = getDb();
    const reactions = db.prepare(
      'SELECT * FROM comment_reactions WHERE comment_id = ? ORDER BY emoji, created_at'
    ).all(context.params.commentId) as CommentReaction[];

    return jsonSuccess(reactions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reactions';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

/**
 * POST /api/comments/[commentId]/reactions
 * Add a reaction to a comment
 */
export async function POST(
  _req: NextRequest,
  context: { params: { commentId: string } }
) {
  try {
    const body = await _req.json();
    const { userId, userName, emoji } = body;

    if (!userId || !emoji) {
      return jsonError('User ID and emoji are required', 400, 'MISSING_FIELDS');
    }

    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Check if user already reacted with this emoji
    const existing = db.prepare(
      'SELECT id FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND emoji = ?'
    ).get(context.params.commentId, userId, emoji);

    if (existing) {
      return jsonSuccess({ alreadyReacted: true, id: existing.id });
    }

    db.prepare(
      'INSERT INTO comment_reactions (id, comment_id, user_id, user_name, emoji, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, context.params.commentId, userId, userName || 'Anonymous', emoji, now);

    const reaction = db.prepare(
      'SELECT * FROM comment_reactions WHERE id = ?'
    ).get(id) as CommentReaction;

    return jsonSuccess(reaction, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to add reaction';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

/**
 * DELETE /api/comments/[commentId]/reactions
 * Remove a reaction
 */
export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId');
    const emoji = searchParams.get('emoji');

    if (!commentId || !userId || !emoji) {
      return jsonError('commentId, userId, and emoji are required', 400, 'MISSING_FIELDS');
    }

    const db = getDb();
    db.prepare(
      'DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ? AND emoji = ?'
    ).run(commentId, userId, emoji);

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to remove reaction';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}