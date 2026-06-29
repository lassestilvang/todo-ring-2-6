/**
 * Automation Rule Repository
 * Handles all database operations related to automation rules
 */

import { getDb } from '../../db/index';
import type { AutomationRule } from '@/types/index';

export class AutomationRuleRepository {
  private db = getDb();

  findAll(userId?: string): AutomationRule[] {
    if (userId) {
      return this.db.prepare(
        'SELECT * FROM automation_rules WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC'
      ).all(userId) as AutomationRule[];
    }
    return this.db.prepare(
      'SELECT * FROM automation_rules ORDER BY created_at DESC'
    ).all() as AutomationRule[];
  }

  findById(id: string): AutomationRule | undefined {
    return this.db.prepare('SELECT * FROM automation_rules WHERE id = ?').get(id) as AutomationRule | undefined;
  }

  create(data: {
    userId?: string;
    name: string;
    triggerType: string;
    triggerValue?: string;
    actionType: string;
    actionValue?: string;
    isEnabled?: boolean;
  }): AutomationRule {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      `INSERT INTO automation_rules (id, user_id, name, trigger_type, trigger_value, action_type, action_value, is_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.userId || null,
      data.name,
      data.triggerType,
      data.triggerValue || null,
      data.actionType,
      data.actionValue || null,
      data.isEnabled ? 1 : 0,
      now,
      now
    );

    return this.findById(id)!;
  }

  update(id: string, data: Partial<Omit<AutomationRule, 'id'>>): AutomationRule {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.userId !== undefined) { updates.push('user_id = ?'); values.push(data.userId); }
    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
    if (data.triggerType !== undefined) { updates.push('trigger_type = ?'); values.push(data.triggerType); }
    if (data.triggerValue !== undefined) { updates.push('trigger_value = ?'); values.push(data.triggerValue); }
    if (data.actionType !== undefined) { updates.push('action_type = ?'); values.push(data.actionType); }
    if (data.actionValue !== undefined) { updates.push('action_value = ?'); values.push(data.actionValue); }
    if (data.isEnabled !== undefined) { updates.push('is_enabled = ?'); values.push(data.isEnabled ? 1 : 0); }

    const now = new Date().toISOString();
    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    this.db.prepare(`UPDATE automation_rules SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM automation_rules WHERE id = ?').run(id);
  }

  toggleEnabled(id: string, enabled: boolean): AutomationRule {
    const now = new Date().toISOString();
    this.db.prepare(
      'UPDATE automation_rules SET is_enabled = ?, updated_at = ? WHERE id = ?'
    ).run(enabled ? 1 : 0, now, id);
    return this.findById(id)!;
  }

  findByTrigger(triggerType: string, userId: string): AutomationRule[] {
    return this.db.prepare(
      'SELECT * FROM automation_rules WHERE trigger_type = ? AND (user_id = ? OR user_id IS NULL) AND is_enabled = 1 ORDER BY created_at DESC'
    ).all(triggerType, userId) as AutomationRule[];
  }
}

// Singleton instance
let automationRuleRepository: AutomationRuleRepository | null = null;

export function getAutomationRuleRepository(): AutomationRuleRepository {
  if (!automationRuleRepository) {
    automationRuleRepository = new AutomationRuleRepository();
  }
  return automationRuleRepository;
}