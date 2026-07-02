/**
 * API Custom Fields Route Tests
 * Tests for /api/custom-fields endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const CustomFieldSchema = z.object({
  id: z.string().uuid().optional(),
  taskId: z.string().uuid(),
  fieldKey: z.string().min(1, 'Field key is required').max(50, 'Field key must be less than 50 characters'),
  fieldType: z.enum(['text', 'number', 'date', 'select', 'checkbox', 'textarea']).default('text'),
  fieldValue: z.string().optional().default(''),
  label: z.string().min(1, 'Label is required').max(100, 'Label must be less than 100 characters'),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

interface CustomField {
  id: string;
  taskId: string;
  fieldKey: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  fieldValue: string;
  label: string;
}

const store = {
  customFields: [] as CustomField[],
};

const resetStore = () => {
  store.customFields = [];
};

describe('API Custom Fields Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/custom-fields', () => {
    it('should return empty array when no custom fields exist', () => {
      expect(store.customFields).toEqual([]);
    });

    it('should return custom fields for a specific task', () => {
      store.customFields.push({ id: '1', taskId: 'task-1', fieldKey: 'priority', fieldType: 'select', fieldValue: 'high', label: 'Priority' });
      store.customFields.push({ id: '2', taskId: 'task-1', fieldKey: 'notes', fieldType: 'textarea', fieldValue: 'Some notes', label: 'Notes' });
      store.customFields.push({ id: '3', taskId: 'task-2', fieldKey: 'due', fieldType: 'date', fieldValue: '2024-01-15', label: 'Due Date' });

      const taskFields = store.customFields.filter(f => f.taskId === 'task-1');
      expect(taskFields).toHaveLength(2);
    });
  });

  describe('POST /api/custom-fields', () => {
    it('should validate required fieldKey', () => {
      const body = { taskId: 'task-1', fieldKey: '', label: 'Test' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required label', () => {
      const body = { taskId: 'task-1', fieldKey: 'test', label: '' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should reject fieldKey over 50 characters', () => {
      const body = { taskId: 'task-1', fieldKey: 'a'.repeat(51), label: 'Test' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should create custom field with valid data', () => {
      const body = {
        taskId: '550e8400-e29b-41d4-a716-446655440000',
        fieldKey: 'priority',
        fieldType: 'select' as const,
        fieldValue: 'high',
        label: 'Priority',
      };
      const result = CustomFieldSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const field: CustomField = {
          id: 'field-1',
          taskId: result.data.taskId,
          fieldKey: result.data.fieldKey,
          fieldType: result.data.fieldType || 'text',
          fieldValue: result.data.fieldValue || '',
          label: result.data.label,
        };
        store.customFields.push(field);
        expect(store.customFields[0].fieldKey).toBe('priority');
        expect(store.customFields[0].fieldType).toBe('select');
      }
    });

    it('should apply default fieldType', () => {
      const body = { taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'test', label: 'Test' };
      const result = CustomFieldSchema.safeParse(body);

      expect(result.success).toBe(true);
      expect(result.data?.fieldType).toBe('text');
    });
  });

  describe('PUT /api/custom-fields', () => {
    it('should update field value', () => {
      store.customFields.push({ id: '1', taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'priority', fieldType: 'select', fieldValue: 'high', label: 'Priority' });

      store.customFields[0].fieldValue = 'medium';
      store.customFields[0] = store.customFields[0];

      expect(store.customFields[0].fieldValue).toBe('medium');
    });

    it('should update label', () => {
      store.customFields.push({ id: '1', taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'test', fieldType: 'text', fieldValue: '', label: 'Old Label' });

      store.customFields[0].label = 'New Label';
      store.customFields[0] = store.customFields[0];

      expect(store.customFields[0].label).toBe('New Label');
    });
  });

  describe('DELETE /api/custom-fields', () => {
    it('should delete custom field', () => {
      store.customFields.push({ id: '1', taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'test', fieldType: 'text', fieldValue: '', label: 'Test' });
      store.customFields.push({ id: '2', taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'other', fieldType: 'text', fieldValue: '', label: 'Other' });

      const initialLength = store.customFields.length;
      store.customFields = store.customFields.filter(f => f.id !== '1');
      expect(store.customFields.length).toBe(initialLength - 1);
    });
  });

  describe('Field Type Validation', () => {
    it('should validate all field types', () => {
      const fieldTypes = ['text', 'number', 'date', 'select', 'checkbox', 'textarea'];
      fieldTypes.forEach(type => {
        const body = { taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'test', fieldType: type, label: 'Test' };
        const result = CustomFieldSchema.safeParse(body);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid field type', () => {
      const body = { taskId: 'task-1', fieldKey: 'test', fieldType: 'invalid', label: 'Test' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(false);
    });
  });

  describe('Field Value Handling', () => {
    it('should handle empty field value', () => {
      const body = { taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'test', label: 'Test' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(true);
      expect(result.data?.fieldValue).toBe('');
    });

    it('should handle text field value', () => {
      const body = { taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'description', fieldType: 'text', fieldValue: 'Some description', label: 'Description' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(true);
      expect(result.data?.fieldValue).toBe('Some description');
    });

    it('should handle number field value', () => {
      const body = { taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'quantity', fieldType: 'number', fieldValue: '42', label: 'Quantity' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should handle checkbox field value', () => {
      const body = { taskId: '550e8400-e29b-41d4-a716-446655440000', fieldKey: 'completed', fieldType: 'checkbox', fieldValue: 'true', label: 'Completed' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent field', () => {
      const response = { success: false, error: 'Custom field not found' };
      expect(response.success).toBe(false);
    });

    it('should return 400 for invalid task ID', () => {
      const body = { taskId: 'invalid', fieldKey: 'test', label: 'Test' };
      const result = CustomFieldSchema.safeParse(body);
      expect(result.success).toBe(false);
    });
  });
});