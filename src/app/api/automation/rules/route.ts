import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';
import { jsonSuccess, jsonError } from '@/lib/api-response';

interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  triggerType: string;
  triggerValue: string | null;
  actionType: string;
  actionValue: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId') || 'current-user';

    const db = getDb();
    const rules = db.prepare(
      'SELECT * FROM automation_rules WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as AutomationRule[];

    return jsonSuccess(rules);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch automation rules';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const rule: AutomationRule = {
      id,
      userId: body.userId || 'current-user',
      name: body.name,
      triggerType: body.triggerType,
      triggerValue: body.triggerValue || null,
      actionType: body.actionType,
      actionValue: body.actionValue || null,
      isEnabled: body.isEnabled !== false,
      createdAt: now,
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO automation_rules (id, user_id, name, trigger_type, trigger_value, action_type, action_value, is_enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rule.id,
      rule.userId,
      rule.name,
      rule.triggerType,
      rule.triggerValue,
      rule.actionType,
      rule.actionValue,
      rule.isEnabled ? 1 : 0,
      rule.createdAt,
      rule.updatedAt
    );

    return jsonSuccess(rule, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create automation rule';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}