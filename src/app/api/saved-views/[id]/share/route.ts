import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

// Generate a shareable URL for a saved view
export async function POST(_req: NextRequest, context: { params: { id: string } }) {
  try {
    const db = getDb();
    const view = db.prepare('SELECT * FROM saved_views WHERE id = ?').get(context.params.id);

    if (!view) {
      return jsonError('Saved view not found', 404, 'NOT_FOUND');
    }

    // Generate a share token
    const shareToken = crypto.randomUUID();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const shareUrl = `${baseUrl}/shared/view/${shareToken}`;

    // Store the share token with expiration (7 days)
    db.prepare(
      'INSERT INTO saved_view_shares (id, view_id, share_token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(
      crypto.randomUUID(),
      context.params.id,
      shareToken,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    return jsonSuccess({ shareUrl, expiresAt: '7 days' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create share link';
    return jsonError(message, 500, 'SHARE_ERROR');
  }
}