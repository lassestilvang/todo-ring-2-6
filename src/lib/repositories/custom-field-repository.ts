/**
 * Custom Field Repository
 * Handles all database operations related to custom fields
 */

import { getDb } from '../../db/index';
import type { CustomField } from '@/types/index';

export class CustomFieldRepository {
  private db = getDb();

  findByTaskId(taskId: string): CustomField[] {
    return this.db.prepare(
      'SELECT * FROM custom_fields WHERE task_id = ? ORDER BY field_key'
    ).all(taskId) as CustomField[];
  }

  findById(id: string): CustomField | undefined {
    return this.db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id) as CustomField | undefined;
  }

  create(data: {
    taskId: string;
    fieldKey: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
    fieldValue?: string;
    label: string;
  }): CustomField {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO custom_fields (id, task_id, field_key, field_type, field_value, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.taskId, data.fieldKey, data.fieldType, data.fieldValue || '', data.label, now);

    return this.findById(id)!;
  }

  update(id: string, fieldValue: string): CustomField {
    const now = new Date().toISOString();

    this.db.prepare(
      'UPDATE custom_fields SET field_value = ?, updated_at = ? WHERE id = ?'
    ).run(fieldValue, now, id);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM custom_fields WHERE id = ?').run(id);
  }

  deleteByTask(taskId: string): void {
    this.db.prepare('DELETE FROM custom_fields WHERE task_id = ?').run(taskId);
  }

  findByFieldKey(taskId: string, fieldKey: string): CustomField | undefined {
    return this.db.prepare(
      'SELECT * FROM custom_fields WHERE task_id = ? AND field_key = ?'
    ).get(taskId, fieldKey) as CustomField | undefined;
  }
}

let customFieldRepository: CustomFieldRepository | null = null;

export function getCustomFieldRepository(): CustomFieldRepository {
  if (!customFieldRepository) {
    customFieldRepository = new CustomFieldRepository();
  }
  return customFieldRepository;
}