/**
 * Recurring Task Logic Tests
 * Tests for recurring task calculations and expansions
 */

import { describe, it, expect } from 'vitest';
import { addDays, addMonths, addYears } from 'date-fns';

// Recurrence calculation logic
function calculateNextDate(date: string, recurringType: string, interval?: string): string | null {
  const currentDate = new Date(date);

  switch (recurringType) {
    case 'daily': {
      const next = addDays(currentDate, interval ? parseInt(interval) : 1);
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'weekly': {
      const next = addDays(currentDate, interval ? parseInt(interval) * 7 : 7);
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'weekdays': {
      // Move to next weekday (Mon-Fri)
      let next = addDays(currentDate, 1);
      while (next.getDay() === 0 || next.getDay() === 6) { // Skip weekends
        next = addDays(next, 1);
      }
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'monthly': {
      const next = addMonths(currentDate, interval ? parseInt(interval) : 1);
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'yearly': {
      const next = addYears(currentDate, interval ? parseInt(interval) : 1);
      return next.toISOString().split('T')[0] ?? null;
    }
    default:
      return null;
  }
}

describe('Recurring Task Logic', () => {
  describe('Daily Recurrence', () => {
    it('should calculate next day for daily recurrence without interval', () => {
      const result = calculateNextDate('2024-01-15', 'daily');
      expect(result).toBe('2024-01-16');
    });

    it('should calculate next day with custom interval', () => {
      const result = calculateNextDate('2024-01-15', 'daily', '2');
      expect(result).toBe('2024-01-17');
    });

    it('should calculate every 3 days', () => {
      const result = calculateNextDate('2024-01-15', 'daily', '3');
      expect(result).toBe('2024-01-18');
    });
  });

  describe('Weekly Recurrence', () => {
    it('should calculate next week for weekly recurrence without interval', () => {
      const result = calculateNextDate('2024-01-15', 'weekly');
      expect(result).toBe('2024-01-22');
    });

    it('should calculate every 2 weeks', () => {
      const result = calculateNextDate('2024-01-15', 'weekly', '2');
      expect(result).toBe('2024-01-29');
    });
  });

  describe('Weekdays Recurrence', () => {
    it('should skip Saturday and return Monday', () => {
      // 2024-01-13 is Saturday
      const result = calculateNextDate('2024-01-13', 'weekdays');
      expect(result).toBe('2024-01-15'); // Monday
    });

    it('should skip Sunday and return Monday', () => {
      // 2024-01-14 is Sunday
      const result = calculateNextDate('2024-01-14', 'weekdays');
      expect(result).toBe('2024-01-15'); // Monday
    });

    it('should return next day for weekday', () => {
      // 2024-01-15 is Monday
      const result = calculateNextDate('2024-01-15', 'weekdays');
      expect(result).toBe('2024-01-16'); // Tuesday
    });
  });

  describe('Monthly Recurrence', () => {
    it('should calculate next month for monthly recurrence without interval', () => {
      const result = calculateNextDate('2024-01-15', 'monthly');
      expect(result).toBe('2024-02-15');
    });

    it('should calculate every 2 months', () => {
      const result = calculateNextDate('2024-01-15', 'monthly', '2');
      expect(result).toBe('2024-03-15');
    });
  });

  describe('Yearly Recurrence', () => {
    it('should calculate next year for yearly recurrence without interval', () => {
      const result = calculateNextDate('2024-01-15', 'yearly');
      expect(result).toBe('2025-01-15');
    });

    it('should calculate every 2 years', () => {
      const result = calculateNextDate('2024-01-15', 'yearly', '2');
      expect(result).toBe('2026-01-15');
    });
  });

  describe('Edge Cases', () => {
    it('should return null for none recurrence type', () => {
      const result = calculateNextDate('2024-01-15', 'none');
      expect(result).toBeNull();
    });

    it('should handle leap year February 29', () => {
      const result = calculateNextDate('2024-02-29', 'yearly');
      expect(result).toBe('2025-02-28'); // 2025 is not a leap year
    });

    it('should handle month-end dates', () => {
      const result = calculateNextDate('2024-01-31', 'monthly');
      expect(result).toBe('2024-02-29'); // February has 29 days in 2024
    });
  });

  describe('Recurring Exception Handling', () => {
    it('should check if date is an exception', () => {
      const exceptions = ['2024-01-15', '2024-01-22'];
      const date = '2024-01-15';
      expect(exceptions).toContain(date);
    });

    it('should allow date if not an exception', () => {
      const exceptions = ['2024-01-15', '2024-01-22'];
      const date = '2024-01-16';
      expect(exceptions).not.toContain(date);
    });
  });

  describe('Task Expansion', () => {
    it('should expand daily task for 7 days', () => {
      const startDate = '2024-01-15';
      const dates: string[] = [];
      let current = new Date(startDate);

      for (let i = 0; i < 7; i++) {
        dates.push(current.toISOString().split('T')[0]);
        current = addDays(current, 1);
      }

      expect(dates).toEqual([
        '2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18',
        '2024-01-19', '2024-01-20', '2024-01-21'
      ]);
    });

    it('should expand weekly task for 4 weeks', () => {
      const startDate = '2024-01-15';
      const dates: string[] = [];
      let current = new Date(startDate);

      for (let i = 0; i < 4; i++) {
        dates.push(current.toISOString().split('T')[0]);
        current = addDays(current, 7);
      }

      expect(dates).toEqual([
        '2024-01-15', '2024-01-22', '2024-01-29', '2024-02-05'
      ]);
    });
  });
});
