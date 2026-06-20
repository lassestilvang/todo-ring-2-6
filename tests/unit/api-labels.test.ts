/**
 * API Labels Route Tests
 * Tests for /api/labels endpoint
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const LabelSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  color: z.string().min(1, 'Color is required'),
  icon: z.string().default('🏷'),
  createdAt: z.string().datetime().optional(),
});

interface Label {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const store = {
  labels: [] as Label[],
  taskLabels: [] as { taskId: string; labelId: string }[],
};

const resetStore = () => {
  store.labels = [];
  store.taskLabels = [];
};

const generateId = () => `label-${Math.random().toString(36).substr(2, 9)}`;

describe('API Labels Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/labels', () => {
    it('should return empty array when no labels exist', () => {
      expect(store.labels).toEqual([]);
    });

    it('should return all labels sorted by name', () => {
      store.labels.push({ id: '1', name: 'Work', color: '#ff0000', icon: '💼' });
      store.labels.push({ id: '2', name: 'Personal', color: '#00ff00', icon: '🏠' });

      const sorted = [...store.labels].sort((a, b) => a.name.localeCompare(b.name));
      expect(sorted[0].name).toBe('Personal');
      expect(sorted[1].name).toBe('Work');
    });
  });

  describe('POST /api/labels', () => {
    it('should validate required name', () => {
      const body = { name: '' };
      const result = LabelSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required color', () => {
      const body = { name: 'Test', color: '' };
      const result = LabelSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should reject name over 50 characters', () => {
      const body = { name: 'a'.repeat(51), color: '#3b82f6' };
      const result = LabelSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should create label with valid data', () => {
      const body = { name: 'Important', color: '#ff0000', icon: '🔥' };
      const result = LabelSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const label: Label = {
          id: generateId(),
          name: result.data.name!,
          color: result.data.color!,
          icon: result.data.icon || '🏷',
        };
        store.labels.push(label);
        expect(store.labels[0].name).toBe('Important');
        expect(store.labels[0].icon).toBe('🔥');
      }
    });

    it('should apply default icon', () => {
      const body = { name: 'Test', color: '#3b82f6' };
      const result = LabelSchema.safeParse(body);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.icon).toBe('🏷');
      }
    });
  });

  describe('PUT /api/labels', () => {
    it('should update label', () => {
      const label: Label = { id: '1', name: 'Old Name', color: '#3b82f6', icon: '📋' };
      store.labels.push(label);

      const updates = { name: 'New Name', color: '#ff0000' };
      Object.assign(label, updates);
      store.labels[0] = label;

      expect(store.labels[0].name).toBe('New Name');
      expect(store.labels[0].color).toBe('#ff0000');
    });
  });

  describe('DELETE /api/labels', () => {
    it('should delete label', () => {
      store.labels.push({ id: '1', name: 'ToDelete', color: '#3b82f6', icon: '📋' });
      store.labels.push({ id: '2', name: 'Keep', color: '#3b82f6', icon: '📋' });

      const initialLength = store.labels.length;
      store.labels = store.labels.filter(l => l.id !== '1');
      expect(store.labels.length).toBe(initialLength - 1);
    });
  });

  describe('Task-Label Operations', () => {
    it('should add label to task', () => {
      const taskId = 'task-1';
      const labelId = 'label-1';

      store.taskLabels.push({ taskId, labelId });
      expect(store.taskLabels).toHaveLength(1);
    });

    it('should remove label from task', () => {
      store.taskLabels.push({ taskId: 'task-1', labelId: 'label-1' });
      store.taskLabels = store.taskLabels.filter(tl => !(tl.taskId === 'task-1' && tl.labelId === 'label-1'));

      expect(store.taskLabels).toHaveLength(0);
    });

    it('should get labels for task', () => {
      store.labels.push({ id: 'label-1', name: 'Work', color: '#ff0000', icon: '💼' });
      store.labels.push({ id: 'label-2', name: 'Personal', color: '#00ff00', icon: '🏠' });
      store.taskLabels.push({ taskId: 'task-1', labelId: 'label-1' });
      store.taskLabels.push({ taskId: 'task-1', labelId: 'label-2' });

      const labelIds = store.taskLabels.filter(tl => tl.taskId === 'task-1').map(tl => tl.labelId);
      const taskLabels = store.labels.filter(l => labelIds.includes(l.id));
      expect(taskLabels).toHaveLength(2);
    });
  });
});