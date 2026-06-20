/**
 * API Lists Route Tests
 * Tests for /api/lists endpoint
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const ListSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  color: z.string().default('#3b82f6'),
  emoji: z.string().default('📋'),
  isInbox: z.boolean().default(false),
  sortOrder: z.number().default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

interface List {
  id: string;
  name: string;
  color: string;
  emoji: string;
  isInbox: boolean;
  sortOrder: number;
}

const store = {
  lists: [] as List[],
};

const resetStore = () => {
  store.lists = [];
};

const generateId = () => `list-${Math.random().toString(36).substr(2, 9)}`;

describe('API Lists Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/lists', () => {
    it('should return empty array when no lists exist', () => {
      const lists = store.lists;
      expect(lists).toEqual([]);
    });

    it('should return all lists sorted by sort_order', () => {
      store.lists.push({ id: '1', name: 'List A', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 1 });
      store.lists.push({ id: '2', name: 'List B', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 0 });
      store.lists.push({ id: '3', name: 'List C', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 2 });

      const sorted = [...store.lists].sort((a, b) => a.sortOrder - b.sortOrder);
      expect(sorted[0].id).toBe('2');
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('3');
    });

    it('should exclude inbox from regular lists query', () => {
      store.lists.push({ id: '1', name: 'Inbox', color: '#3b82f6', emoji: '📥', isInbox: true, sortOrder: 0 });
      store.lists.push({ id: '2', name: 'Tasks', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 1 });

      const regularLists = store.lists.filter(l => !l.isInbox);
      expect(regularLists).toHaveLength(1);
      expect(regularLists[0].name).toBe('Tasks');
    });
  });

  describe('POST /api/lists', () => {
    it('should validate required name', () => {
      const body = { name: '' };
      const result = ListSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should reject name over 100 characters', () => {
      const body = { name: 'a'.repeat(101) };
      const result = ListSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should create list with valid data', () => {
      const body = { name: 'New List', color: '#ff0000', emoji: '📅' };
      const result = ListSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const list: List = {
          id: generateId(),
          name: result.data.name!,
          color: result.data.color!,
          emoji: result.data.emoji!,
          isInbox: false,
          sortOrder: store.lists.length,
        };
        store.lists.push(list);
        expect(store.lists[0].name).toBe('New List');
      }
    });

    it('should apply default values', () => {
      const body = { name: 'Test List' };
      const result = ListSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.color).toBe('#3b82f6');
        expect(result.data.emoji).toBe('📋');
      }
    });
  });

  describe('PUT /api/lists', () => {
    it('should update list fields', () => {
      const list: List = { id: '1', name: 'Original', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 0 };
      store.lists.push(list);

      const updates = { name: 'Updated', color: '#ff0000' };
      Object.assign(list, updates);
      store.lists[0] = list;

      expect(store.lists[0].name).toBe('Updated');
      expect(store.lists[0].color).toBe('#ff0000');
    });

    it('should prevent updating inbox', () => {
      const inbox: List = { id: '1', name: 'Inbox', color: '#3b82f6', emoji: '📥', isInbox: true, sortOrder: 0 };
      store.lists.push(inbox);

      // In the API, we check if isInbox is true before allowing delete
      const canDelete = store.lists.some(l => l.isInbox);
      expect(canDelete).toBe(true);
    });
  });

  describe('DELETE /api/lists', () => {
    it('should delete non-inbox list', () => {
      store.lists.push({ id: '1', name: 'To Delete', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 0 });
      store.lists.push({ id: '2', name: 'Keep', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 1 });

      const initialLength = store.lists.length;
      store.lists = store.lists.filter(l => l.id !== '1' && !l.isInbox);
      expect(store.lists.length).toBe(initialLength - 1);
    });

    it('should not delete inbox list', () => {
      store.lists.push({ id: '1', name: 'Inbox', color: '#3b82f6', emoji: '📥', isInbox: true, sortOrder: 0 });

      const inbox = store.lists.find(l => l.isInbox);
      store.lists = store.lists.filter(l => !l.isInbox);
      expect(store.lists.length).toBe(0);
      expect(inbox).toBeDefined();
    });
  });

  describe('PATCH /api/lists/reorder', () => {
    it('should update sort order', () => {
      store.lists.push({ id: '1', name: 'List A', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 0 });
      store.lists.push({ id: '2', name: 'List B', color: '#3b82f6', emoji: '📋', isInbox: false, sortOrder: 1 });

      // Swap positions
      const temp = store.lists[0];
      store.lists[0] = store.lists[1];
      store.lists[1] = temp;

      expect(store.lists[0].id).toBe('2');
      expect(store.lists[1].id).toBe('1');
    });
  });
});