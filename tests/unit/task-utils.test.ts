import { describe, it, expect } from 'vitest';
import {
  formatTaskDate,
  formatTaskDeadline,
  getTaskStatusInfo,
  getPriorityLevel,
} from '../../src/lib/task-utils';

describe('Task Utilities', () => {
  describe('formatTaskDate', () => {
    it('should return "No date" for null', () => {
      expect(formatTaskDate(null)).toBe('No date');
    });

    it('should return "Today" for today', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(formatTaskDate(today)).toBe('Today');
    });

    it('should return "Tomorrow" for tomorrow', () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      expect(formatTaskDate(tomorrow)).toBe('Tomorrow');
    });
  });

  describe('formatTaskDeadline', () => {
    it('should return "No deadline" for null', () => {
      const result = formatTaskDeadline(null);
      expect(result.text).toBe('No deadline');
      expect(result.isOverdue).toBe(false);
    });

    it('should detect overdue tasks', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const result = formatTaskDeadline(pastDate);
      expect(result.isOverdue).toBe(true);
    });
  });

  describe('getTaskStatusInfo', () => {
    it('should return correct info for pending status', () => {
      const info = getTaskStatusInfo('pending');
      expect(info.label).toBe('Pending');
      expect(info.color).toBe('text-muted-foreground');
    });

    it('should return correct info for completed status', () => {
      const info = getTaskStatusInfo('completed');
      expect(info.label).toBe('Completed');
      expect(info.color).toBe('text-emerald-500');
    });
  });

  describe('getPriorityLevel', () => {
    it('should return 0 for high priority', () => {
      expect(getPriorityLevel('high')).toBe(0);
    });

    it('should return 1 for medium priority', () => {
      expect(getPriorityLevel('medium')).toBe(1);
    });

    it('should return 2 for low priority', () => {
      expect(getPriorityLevel('low')).toBe(2);
    });

    it('should return 3 for none priority', () => {
      expect(getPriorityLevel('none')).toBe(3);
    });
  });
});