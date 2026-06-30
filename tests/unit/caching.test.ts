/**
 * Server Cache Tests
 * Tests for the caching layer
 */

import { describe, it, expect } from 'vitest';
import { DashboardCache, TaskCache } from '../../src/lib/server-cache';

describe('Server Cache', () => {
  describe('DashboardCache', () => {
    it('should generate correct cache keys for dashboard', () => {
      const userId = 'user-123';
      const period = 'week';

      expect(DashboardCache.taskAnalytics(userId, period)).toBe('dashboard:analytics:tasks:user-123:week');
      expect(DashboardCache.userStats(userId)).toBe('dashboard:stats:user:user-123');
      expect(DashboardCache.quickStats(userId)).toBe('dashboard:quickstats:user-123');
      expect(DashboardCache.productivity(userId, 'month')).toBe('dashboard:productivity:user-123:month');
    });

    it('should generate consistent keys', () => {
      const userId = 'user-456';
      expect(DashboardCache.quickStats(userId)).toBe(DashboardCache.quickStats(userId));
    });
  });

  describe('TaskCache', () => {
    it('should generate correct cache keys for tasks', () => {
      const userId = 'user-123';

      expect(TaskCache.view(userId, 'today', '')).toBe('tasks:user-123:today:');
      expect(TaskCache.taskDetail('task-456')).toBe('task:detail:task-456');
      expect(TaskCache.userTasks(userId)).toBe('tasks:user:user-123');
    });

    it('should generate keys with filters', () => {
      const userId = 'user-123';
      const filters = 'status:completed';

      expect(TaskCache.view(userId, 'custom', filters)).toBe('tasks:user-123:custom:status:completed');
    });

    it('should generate consistent keys', () => {
      const taskId = 'task-789';
      expect(TaskCache.taskDetail(taskId)).toBe(TaskCache.taskDetail(taskId));
    });
  });
});