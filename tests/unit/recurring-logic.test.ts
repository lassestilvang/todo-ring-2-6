/**
 * Recurring Task Logic Tests
 *
 * Tests the recurrence calculation logic independently.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { addDays, addMonths, addYears } from 'date-fns';

// Replicate the calculateNextDate logic for testing
// Using UTC to avoid timezone issues
function calculateNextDate(date: string, recurringType: string, interval?: string): string | null {
  // Parse date as UTC to avoid timezone issues
  const parts = date.split('-');
  const currentDate = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));

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
      let next = addDays(currentDate, 1);
      while (next.getUTCDay() === 0 || next.getUTCDay() === 6) {
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
  describe('calculateNextDate', () => {
    describe('daily recurrence', () => {
      it('should calculate next day correctly', () => {
        const result = calculateNextDate('2024-01-15', 'daily', '1');
        expect(result).toBe('2024-01-16');
      });

      it('should handle interval > 1', () => {
        const result = calculateNextDate('2024-01-15', 'daily', '3');
        expect(result).toBe('2024-01-18');
      });

      it('should default to 1 day when no interval', () => {
        const result = calculateNextDate('2024-01-15', 'daily');
        expect(result).toBe('2024-01-16');
      });
    });

    describe('weekly recurrence', () => {
      it('should calculate next week correctly', () => {
        const result = calculateNextDate('2024-01-15', 'weekly', '1');
        expect(result).toBe('2024-01-22');
      });

      it('should handle weekly interval', () => {
        const result = calculateNextDate('2024-01-15', 'weekly', '2');
        expect(result).toBe('2024-01-29');
      });
    });

    describe('weekdays recurrence', () => {
      it('should skip weekend from Friday', () => {
        const result = calculateNextDate('2024-01-12', 'weekdays');
        expect(result).toBe('2024-01-15');
      });

      it('should skip weekend from Saturday', () => {
        const result = calculateNextDate('2024-01-13', 'weekdays');
        expect(result).toBe('2024-01-15');
      });

      it('should skip weekend from Sunday', () => {
        const result = calculateNextDate('2024-01-14', 'weekdays');
        expect(result).toBe('2024-01-15');
      });

      it('should return Monday for weekday', () => {
        const result = calculateNextDate('2024-01-10', 'weekdays');
        expect(result).toBe('2024-01-11');
      });
    });

    describe('monthly recurrence', () => {
      it('should calculate next month correctly', () => {
        const result = calculateNextDate('2024-01-15', 'monthly', '1');
        expect(result).toBe('2024-02-15');
      });

      it('should handle 12-month interval', () => {
        const result = calculateNextDate('2024-01-15', 'monthly', '12');
        expect(result).toBe('2025-01-15');
      });
    });

    describe('yearly recurrence', () => {
      it('should calculate next year correctly', () => {
        const result = calculateNextDate('2024-01-15', 'yearly', '1');
        expect(result).toBe('2025-01-15');
      });

      it('should handle 2-year interval', () => {
        const result = calculateNextDate('2024-01-15', 'yearly', '2');
        expect(result).toBe('2026-01-15');
      });
    });

    describe('invalid recurrence type', () => {
      it('should return null for invalid type', () => {
        const result = calculateNextDate('2024-01-15', 'invalid');
        expect(result).toBeNull();
      });

      it('should return null for empty string', () => {
        const result = calculateNextDate('2024-01-15', '');
        expect(result).toBeNull();
      });

      it('should return null for none type', () => {
        const result = calculateNextDate('2024-01-15', 'none');
        expect(result).toBeNull();
      });
    });
  });
});