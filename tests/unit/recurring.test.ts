import { describe, it, expect } from 'vitest';

// Recurring task logic
const recurringTypes = ['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly'] as const;

const getRecurrenceInterval = (type: typeof recurringTypes[number]): number => {
  switch (type) {
    case 'daily':
      return 1;
    case 'weekly':
      return 7;
    case 'weekdays':
      return 1;
    case 'monthly':
      return 30;
    case 'yearly':
      return 365;
    default:
      return 0;
  }
};

const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

describe('Recurring Task Logic', () => {
  describe('getRecurrenceInterval', () => {
    it('should return 1 for daily', () => {
      expect(getRecurrenceInterval('daily')).toBe(1);
    });

    it('should return 7 for weekly', () => {
      expect(getRecurrenceInterval('weekly')).toBe(7);
    });

    it('should return 0 for none', () => {
      expect(getRecurrenceInterval('none')).toBe(0);
    });

    it('should return 365 for yearly', () => {
      expect(getRecurrenceInterval('yearly')).toBe(365);
    });

    it('should return 30 for monthly', () => {
      expect(getRecurrenceInterval('monthly')).toBe(30);
    });
  });

  describe('isWeekday', () => {
    it('should return true for Monday', () => {
      const monday = new Date('2024-01-15');
      expect(isWeekday(monday)).toBe(true);
    });

    it('should return true for Tuesday', () => {
      const tuesday = new Date('2024-01-16');
      expect(isWeekday(tuesday)).toBe(true);
    });

    it('should return true for Friday', () => {
      const friday = new Date('2024-01-12');
      expect(isWeekday(friday)).toBe(true);
    });

    it('should return false for Saturday', () => {
      const saturday = new Date('2024-01-13');
      expect(isWeekday(saturday)).toBe(false);
    });

    it('should return false for Sunday', () => {
      const sunday = new Date('2024-01-14');
      expect(isWeekday(sunday)).toBe(false);
    });
  });

  describe('Date Calculations', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-01');
      date.setDate(date.getDate() + 7);
      expect(date.toISOString().split('T')[0]).toBe('2024-01-08');
    });

    it('should add months correctly', () => {
      const date = new Date('2024-01-15');
      date.setMonth(date.getMonth() + 1);
      expect(date.getMonth()).toBe(1);
    });

    it('should add years correctly', () => {
      const date = new Date('2024-01-15');
      date.setFullYear(date.getFullYear() + 1);
      expect(date.getFullYear()).toBe(2025);
    });

    it('should handle month overflow', () => {
      const date = new Date('2024-01-31');
      date.setMonth(date.getMonth() + 1);
      // Feb 31 doesn't exist, so it rolls to March
      expect(date.getMonth()).toBe(2); // March (0-indexed)
    });
  });

  describe('Task Instance Generation', () => {
    it('should not create duplicate instances', () => {
      const existingTasks = [
        { title: 'Recurring Task', date: '2024-01-15' },
      ];

      const wouldCreate = (title: string, date: string): boolean => {
        return !existingTasks.some(t => t.title === title && t.date === date);
      };

      expect(wouldCreate('Recurring Task', '2024-01-15')).toBe(false);
      expect(wouldCreate('Recurring Task', '2024-01-16')).toBe(true);
    });

    it('should generate instances for next N days', () => {
      const startDate = new Date('2024-01-01');
      const instances: string[] = [];

      for (let i = 1; i <= 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        instances.push(date.toISOString().split('T')[0]);
      }

      expect(instances).toHaveLength(7);
      expect(instances[0]).toBe('2024-01-02');
      expect(instances[6]).toBe('2024-01-08');
    });
  });

  describe('Recurrence Rules', () => {
    it('should skip weekends for weekdays recurrence', () => {
      const dates: string[] = [];
      const start = new Date('2024-01-01'); // Monday

      for (let i = 0; i < 10; i++) {
        const date = new Date(start);
        date.setDate(date.getDate() + i);
        const day = date.getDay();
        // Skip Saturday (6) and Sunday (0)
        if (day !== 0 && day !== 6) {
          dates.push(date.toISOString().split('T')[0]);
        }
      }

      // Should have more dates than days
      expect(dates.length).toBeGreaterThan(5);
    });

    it('should handle end of month for monthly recurrence', () => {
      const date = new Date('2024-01-31');
      date.setMonth(date.getMonth() + 1);
      // Feb doesn't have 31 days
      expect(date.getMonth()).toBe(2); // March
    });
  });
});