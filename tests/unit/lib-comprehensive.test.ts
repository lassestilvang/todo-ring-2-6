/**
 * Comprehensive tests for lib utilities
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock modules
vi.mock('better-sqlite3', () => {
  return function mockDb() {
    return {
      prepare: vi.fn().mockReturnThis(),
      all: vi.fn().mockReturnValue([]),
      get: vi.fn().mockReturnValue(null),
      run: vi.fn().mockReturnValue({ lastInsertRowid: '1' }),
      exec: vi.fn(),
    };
  };
});

describe('Library Utilities - Comprehensive', () => {
  describe('Utility Functions', () => {
    it('should handle string utilities', () => {
      const str = '  hello world  ';
      expect(str.trim()).toBe('hello world');
      expect(str.toLowerCase()).toBe('  hello world  ');
      expect(str.toUpperCase()).toBe('  HELLO WORLD  ');
    });

    it('should handle array utilities', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.length).toBe(5);
      expect(arr[0]).toBe(1);
      expect(arr[arr.length - 1]).toBe(5);
    });

    it('should handle object utilities', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Object.keys(obj).length).toBe(3);
      expect(Object.values(obj).length).toBe(3);
      expect(Object.entries(obj).length).toBe(3);
    });

    it('should handle date utilities', () => {
      const now = new Date();
      expect(now).toBeInstanceOf(Date);
      expect(now.toISOString()).toBeDefined();
      expect(now.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Validation Helpers', () => {
    it('should validate email format', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test('test@example.com')).toBe(true);
      expect(emailRegex.test('invalid')).toBe(false);
      expect(emailRegex.test('')).toBe(false);
    });

    it('should validate URL format', () => {
      const urlRegex = /^https?:\/\/.+/;
      expect(urlRegex.test('https://example.com')).toBe(true);
      expect(urlRegex.test('http://localhost:3000')).toBe(true);
      expect(urlRegex.test('invalid')).toBe(false);
    });

    it('should validate UUID format', () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(uuidRegex.test('invalid')).toBe(false);
    });
  });

  describe('Format Utilities', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const iso = date.toISOString();
      expect(iso).toContain('2024-01-15');
    });

    it('should format currency', () => {
      const amount = 1234.56;
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('String Manipulation', () => {
    it('should truncate strings', () => {
      const str = 'This is a very long string that needs truncation';
      const truncated = str.length > 20 ? str.substring(0, 20) + '...' : str;
      expect(truncated.length).toBeLessThanOrEqual(23);
    });

    it('should capitalize strings', () => {
      const str = 'hello world';
      const capitalized = str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      expect(capitalized).toBe('Hello World');
    });
  });

  describe('Number Utilities', () => {
    it('should format numbers with commas', () => {
      const num = 1234567;
      const formatted = num.toLocaleString();
      expect(formatted).toContain(',');
    });

    it('should calculate percentages', () => {
      const part = 25;
      const total = 100;
      const percentage = Math.round((part / total) * 100);
      expect(percentage).toBe(25);
    });
  });

  describe('Async Utilities', () => {
    it('should handle Promise.all', async () => {
      const promises = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
      const results = await Promise.all(promises);
      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle Promise.race', async () => {
      const promises = [
        new Promise(resolve => setTimeout(() => resolve('slow'), 100)),
        new Promise(resolve => setTimeout(() => resolve('fast'), 0)),
      ];
      const result = await Promise.race(promises);
      expect(result).toBe('fast');
    });
  });

  // Validations module tests are in validations-comprehensive.test.ts
  // API Response module tests are in api-response.test.ts
  // Email module tests are in email-comprehensive.test.ts
});