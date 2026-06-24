import { describe, it, expect } from 'vitest';
import {
  formatTaskDate,
  formatTaskDeadline,
  getTaskStatusInfo,
  getPriorityLevel,
  getTaskAging,
  getAgeLabel,
} from '../../src/lib/task-utils';

describe('Task Utilities - Comprehensive', () => {
  describe('formatTaskDate', () => {
    it('should return "No date" for null', () => {
      expect(formatTaskDate(null)).toBe('No date');
    });

    it('should return "No date" for undefined', () => {
      expect(formatTaskDate(undefined)).toBe('No date');
    });

    it('should return formatted date for today', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = formatTaskDate(today);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return formatted date for future dates', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const result = formatTaskDate(futureDate);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return formatted date for other dates', () => {
      const date = '2024-01-15';
      const result = formatTaskDate(date);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });
  });

  describe('formatTaskDeadline', () => {
    it('should return "No deadline" for null', () => {
      const result = formatTaskDeadline(null);
      expect(result.text).toBe('No deadline');
      expect(result.isOverdue).toBe(false);
    });

    it('should return "No deadline" for undefined', () => {
      const result = formatTaskDeadline(undefined);
      expect(result.text).toBe('No deadline');
      expect(result.isOverdue).toBe(false);
    });

    it('should detect overdue tasks', () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const result = formatTaskDeadline(pastDate);
      expect(result.isOverdue).toBe(true);
    });

    it('should format future deadline correctly', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const result = formatTaskDeadline(futureDate);
      expect(result.isOverdue).toBe(false);
      expect(result.text).toContain('Due');
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

    it('should return correct info for in_progress status', () => {
      const info = getTaskStatusInfo('in_progress');
      expect(info.label).toBe('In Progress');
      expect(info.color).toBe('text-blue-500');
    });

    it('should return correct info for cancelled status', () => {
      const info = getTaskStatusInfo('cancelled');
      expect(info.label).toBe('Cancelled');
      expect(info.color).toBe('text-red-500');
    });

    it('should return pending for unknown status', () => {
      const info = getTaskStatusInfo('unknown' as any);
      expect(info.label).toBe('Pending');
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

  describe('getTaskAging', () => {
    it('should return new for recent tasks', () => {
      const recentDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const result = getTaskAging({
        createdAt: recentDate,
        deadline: null,
        status: 'pending',
      });
      expect(result.ageCategory).toBe('new');
    });

    it('should return aging for older tasks', () => {
      const olderDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const result = getTaskAging({
        createdAt: olderDate,
        deadline: null,
        status: 'pending',
      });
      expect(result.ageCategory).toBe('aging');
    });

    it('should detect overdue status', () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const result = getTaskAging({
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        deadline: pastDate,
        status: 'pending',
      });
      expect(result.isOverdue).toBe(true);
    });

    it('should reduce opacity for completed tasks', () => {
      const result = getTaskAging({
        createdAt: new Date().toISOString(),
        deadline: null,
        status: 'completed',
      });
      expect(result.opacity).toBeLessThan(1);
    });
  });

  describe('getAgeLabel', () => {
    it('should return "New" for new', () => {
      expect(getAgeLabel('new')).toBe('New');
    });

    it('should return "Recent" for recent', () => {
      expect(getAgeLabel('recent')).toBe('Recent');
    });

    it('should return "Aging" for aging', () => {
      expect(getAgeLabel('aging')).toBe('Aging');
    });

    it('should return "Old" for old', () => {
      expect(getAgeLabel('old')).toBe('Old');
    });

    it('should return "Stale" for stale', () => {
      expect(getAgeLabel('stale')).toBe('Stale');
    });

    it('should return empty string for unknown', () => {
      expect(getAgeLabel('unknown')).toBe('');
    });
  });
});
