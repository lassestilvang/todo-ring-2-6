import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getCommentMentions, addCommentMention, markMentionAsNotified } from '@/db/operations';

ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const mentions = getCommentMentions(userId);
    return jsonSuccess(mentions);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch mentions';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { commentId, userId, userName } = body;

    if (!commentId || !userId || !userName) {
      return jsonError('commentId, userId, and userName are required', 400, 'MISSING_PARAMS');
    }

    const mention = addCommentMention({ commentId, userId, userName });
    return jsonSuccess(mention, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create mention';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PATCH(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { mentionId } = body;

    if (!mentionId) {
      return jsonError('mentionId is required', 400, 'MISSING_ID');
    }

    markMentionAsNotified(mentionId);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to mark mention as notified';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}
