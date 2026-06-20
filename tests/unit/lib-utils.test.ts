import { describe, it, expect } from 'vitest';

// Test utility functions that would be in lib/utils.ts
// These are common utility patterns used in the application

describe('Utility Functions', () => {
  describe('Format Utilities', () => {
    it('should format date for display', () => {
      const formatDate = (date: string): string => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      };
      const result = formatDate('2024-06-15T00:00:00Z');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format relative time', () => {
      const formatRelativeTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
      };

      const minuteAgo = new Date(Date.now() - 30000);
      expect(formatRelativeTime(minuteAgo)).toBe('just now');

      const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
      expect(formatRelativeTime(fiveMinsAgo)).toBe('5 minutes ago');
    });

    it('should format duration', () => {
      const formatDuration = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
        if (hours > 0) return `${hours}h`;
        return `${mins}m`;
      };

      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(120)).toBe('2h');
    });
  });

  describe('Priority Utilities', () => {
    const priorityOrder = { low: 0, medium: 1, high: 2, none: 3 };

    it('should compare priorities', () => {
      expect(priorityOrder['high'] > priorityOrder['medium']).toBe(true);
      expect(priorityOrder['low'] < priorityOrder['high']).toBe(true);
    });

    it('should get priority color', () => {
      const getPriorityColor = (priority: string): string => {
        switch (priority) {
          case 'high': return 'destructive';
          case 'medium': return 'warning';
          case 'low': return 'secondary';
          default: return 'default';
        }
      };

      expect(getPriorityColor('high')).toBe('destructive');
      expect(getPriorityColor('medium')).toBe('warning');
      expect(getPriorityColor('low')).toBe('secondary');
      expect(getPriorityColor('none')).toBe('default');
    });
  });

  describe('Status Utilities', () => {
    const statusColors = {
      pending: 'secondary',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'muted',
    };

    it('should get status color', () => {
      expect(statusColors['pending']).toBe('secondary');
      expect(statusColors['completed']).toBe('success');
    });

    it('should check if status is terminal', () => {
      const isTerminalStatus = (status: string): boolean => {
        return status === 'completed' || status === 'cancelled';
      };

      expect(isTerminalStatus('completed')).toBe(true);
      expect(isTerminalStatus('cancelled')).toBe(true);
      expect(isTerminalStatus('pending')).toBe(false);
      expect(isTerminalStatus('in_progress')).toBe(false);
    });
  });

  describe('Sort Utilities', () => {
    it('should sort by multiple criteria', () => {
      const items = [
        { id: '1', priority: 'high', sort_order: 2 },
        { id: '2', priority: 'low', sort_order: 1 },
        { id: '3', priority: 'high', sort_order: 1 },
      ];

      const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
      const sorted = [...items].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
        if (priorityDiff !== 0) return priorityDiff;
        return a.sort_order - b.sort_order;
      });

      expect(sorted[0].id).toBe('3');
      expect(sorted[1].id).toBe('1');
      expect(sorted[2].id).toBe('2');
    });
  });

  describe('Filter Utilities', () => {
    it('should filter by search query', () => {
      const items = [
        { title: 'Buy groceries' },
        { title: 'Walk the dog' },
        { title: 'Do laundry' },
      ];

      const search = (items: any[], query: string) => {
        if (!query) return items;
        const q = query.toLowerCase();
        return items.filter(item => item.title.toLowerCase().includes(q));
      };

      expect(search(items, 'buy').length).toBe(1);
      expect(search(items, 'walk').length).toBe(1);
      expect(search(items, '').length).toBe(3);
    });

    it('should filter by status', () => {
      const tasks = [
        { id: '1', status: 'completed' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'in_progress' },
      ];

      const activeTasks = tasks.filter(t => t.status !== 'completed');
      expect(activeTasks).toHaveLength(2);
    });
  });
});