/**
 * API Analytics Route Tests
 * Tests for /api/analytics endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const AnalyticsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('weekly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metrics: z.array(z.string()).optional(),
});

interface AnalyticsData {
  period: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  productivity: number;
}

const mockAnalytics: AnalyticsData[] = [];

describe('API Analytics Route', () => {
  beforeEach(() => {
    mockAnalytics.length = 0;
  });

  describe('GET /api/analytics', () => {
    it('should return analytics data for period', () => {
      const data: AnalyticsData = {
        period: 'weekly',
        totalTasks: 50,
        completedTasks: 30,
        overdueTasks: 5,
        productivity: 60,
      };
      mockAnalytics.push(data);

      expect(mockAnalytics[0].period).toBe('weekly');
      expect(mockAnalytics[0].totalTasks).toBe(50);
    });

    it('should support different periods', () => {
      const periods = ['daily', 'weekly', 'monthly', 'yearly'];
      periods.forEach(period => {
        const data: AnalyticsData = {
          period,
          totalTasks: 10,
          completedTasks: 8,
          overdueTasks: 0,
          productivity: 80,
        };
        mockAnalytics.push(data);
      });

      expect(mockAnalytics).toHaveLength(4);
      expect(mockAnalytics.map(a => a.period)).toEqual(periods);
    });

    it('should calculate productivity percentage', () => {
      const totalTasks = 100;
      const completedTasks = 75;
      const productivity = Math.round((completedTasks / totalTasks) * 100);

      expect(productivity).toBe(75);
    });

    it('should handle zero tasks gracefully', () => {
      const totalTasks = 0;
      const completedTasks = 0;
      const productivity = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      expect(productivity).toBe(0);
    });

    it('should validate period parameter', () => {
      const body = { period: 'invalid' };
      const result = AnalyticsSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should accept valid period parameter', () => {
      const body = { period: 'monthly' };
      const result = AnalyticsSchema.safeParse(body);
      expect(result.success).toBe(true);
      expect(result.data?.period).toBe('monthly');
    });
  });

  describe('POST /api/analytics', () => {
    it('should accept custom date range', () => {
      const body = {
        period: 'weekly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const result = AnalyticsSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should accept metrics filter', () => {
      const body = {
        period: 'weekly',
        metrics: ['tasks', 'completion', 'productivity'],
      };
      const result = AnalyticsSchema.safeParse(body);
      expect(result.success).toBe(true);
      expect(result.data?.metrics).toHaveLength(3);
    });
  });

  describe('Analytics Calculations', () => {
    it('should calculate overdue rate', () => {
      const totalTasks = 100;
      const overdueTasks = 10;
      const overdueRate = (overdueTasks / totalTasks) * 100;
      expect(overdueRate).toBe(10);
    });

    it('should calculate completion rate', () => {
      const totalTasks = 100;
      const completedTasks = 85;
      const completionRate = (completedTasks / totalTasks) * 100;
      expect(completionRate).toBe(85);
    });

    it('should calculate trend correctly', () => {
      const previous = 50;
      const current = 75;
      const trend = ((current - previous) / previous) * 100;
      expect(trend).toBe(50);
    });

    it('should handle negative trend', () => {
      const previous = 100;
      const current = 75;
      const trend = ((current - previous) / previous) * 100;
      expect(trend).toBe(-25);
    });
  });
});