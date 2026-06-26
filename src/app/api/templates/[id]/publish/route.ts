import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await _req.json();
    const { id } = params;
    const { publish, userId } = body;

    const db = getDb();

    // Verify ownership
    const template = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as { created_by: string };
    if (!template) {
      return jsonError('Template not found', 404, 'NOT_FOUND');
    }

    if (template.created_by !== userId) {
      return jsonError('Only the template creator can publish it', 403, 'FORBIDDEN');
    }

    db.prepare('UPDATE task_templates SET is_public = ?, updated_at = ? WHERE id = ?')
      .run(publish ? 1 : 0, new Date().toISOString(), id);

    const updated = db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as any;

    return jsonSuccess({
      ...updated,
      isPublic: Boolean(updated.is_public),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to publish template';
    return jsonError(message, 500, 'PUBLISH_ERROR');
  }
}