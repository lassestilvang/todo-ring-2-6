import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ThemeSchema } from '@/lib/validations';
import { getDb } from '@/db/operations';

ensureDbInitialized();

// Get all themes
export async function GET() {
  const db = getDb();
  const themes = db.prepare('SELECT * FROM themes ORDER BY created_at DESC').all();
  return jsonSuccess(themes);
}

// Create a new theme
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = ThemeSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { name, colors, emoji } = validated.data;
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(
      'INSERT INTO themes (id, name, colors, emoji, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, name, JSON.stringify(colors), emoji, now, now);

    return jsonSuccess({ id, name, colors, emoji }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create theme';
    return jsonError(message, 500, 'THEME_ERROR');
  }
}