import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('Date Utilities', () => {
    it('should get today date string', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should add days to date', () => {
      const today = new Date('2024-01-15');
      const future = new Date(today);
      future.setDate(future.getDate() + 7);
      expect(future.toISOString().split('T')[0]).toBe('2024-01-22');
    });

    it('should calculate date range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-07');
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(6);
    });

    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-06-15T12:30:45.123Z');
      const formatted = date.toISOString().split('T')[0];
      expect(formatted).toBe('2024-06-15');
    });

    it('should compare dates correctly', () => {
      const yesterday = new Date('2024-01-01');
      const today = new Date('2024-01-02');
      const tomorrow = new Date('2024-01-03');

      expect(yesterday < today).toBe(true);
      expect(today < tomorrow).toBe(true);
      expect(yesterday < tomorrow).toBe(true);
    });
  });

  describe('String Utilities', () => {
    it('should generate UUID-like string', () => {
      const generateId = (): string => {
        return `id-${Math.random().toString(36).substr(2, 9)}`;
      };
      const id = generateId();
      expect(id).toMatch(/^id-[a-z0-9]+$/);
    });

    it('should handle empty strings', () => {
      const defaultIfEmpty = (value: string, defaultValue: string): string => {
        return value || defaultValue;
      };
      expect(defaultIfEmpty('', 'default')).toBe('default');
      expect(defaultIfEmpty('value', 'default')).toBe('value');
    });

    it('should trim whitespace', () => {
      const trim = (s: string): string => s.trim();
      expect(trim('  hello  ')).toBe('hello');
    });

    it('should capitalize first letter', () => {
      const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should truncate long strings', () => {
      const truncate = (s: string, maxLength: number): string => {
        return s.length > maxLength ? s.substring(0, maxLength) + '...' : s;
      };
      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
    });
  });

  describe('Array Utilities', () => {
    it('should filter completed items', () => {
      const tasks = [
        { id: '1', status: 'completed' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'completed' },
      ];
      const completed = tasks.filter(t => t.status === 'completed');
      expect(completed).toHaveLength(2);
    });

    it('should sort by order', () => {
      const items = [
        { id: '1', sort_order: 3 },
        { id: '2', sort_order: 1 },
        { id: '3', sort_order: 2 },
      ];
      const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
      expect(sorted.map(i => i.id)).toEqual(['2', '3', '1']);
    });

    it('should map array to new format', () => {
      const items = [{ id: '1', name: 'One' }, { id: '2', name: 'Two' }];
      const mapped = items.map(i => ({ ...i, upper: i.name.toUpperCase() }));
      expect(mapped[0].upper).toBe('ONE');
    });

    it('should find item by property', () => {
      const items = [{ id: '1', name: 'One' }, { id: '2', name: 'Two' }];
      const found = items.find(i => i.id === '2');
      expect(found?.name).toBe('Two');
    });

    it('should reduce array to single value', () => {
      const numbers = [1, 2, 3, 4, 5];
      const sum = numbers.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(15);
    });
  });

  describe('Number Utilities', () => {
    it('should calculate percentage', () => {
      const percentage = (value: number, total: number): number => {
        return Math.round((value / total) * 100);
      };
      expect(percentage(25, 100)).toBe(25);
      expect(percentage(1, 3)).toBe(33);
    });

    it('should handle zero division', () => {
      const safePercentage = (value: number, total: number): number => {
        return total === 0 ? 0 : Math.round((value / total) * 100);
      };
      expect(safePercentage(10, 0)).toBe(0);
    });

    it('should round to decimal places', () => {
      const roundTo = (num: number, decimals: number): number => {
        return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
      };
      expect(roundTo(1.2345, 2)).toBe(1.23);
    });

    it('should clamp number between min and max', () => {
      const clamp = (num: number, min: number, max: number): number => {
        return Math.min(Math.max(num, min), max);
      };
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
    });

    it('should validate URL format', () => {
      const isValidUrl = (url: string): boolean => {
        return /^https?:\/\/.+/.test(url);
      };
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('invalid')).toBe(false);
    });

    it('should check required fields', () => {
      const hasRequired = (obj: Record<string, any>, fields: string[]): boolean => {
        return fields.every(f => obj[f] !== undefined && obj[f] !== null && obj[f] !== '');
      };
      expect(hasRequired({ name: 'John', email: 'john@example.com' }, ['name', 'email'])).toBe(true);
      expect(hasRequired({ name: '', email: 'test' }, ['name', 'email'])).toBe(false);
    });
  });
});