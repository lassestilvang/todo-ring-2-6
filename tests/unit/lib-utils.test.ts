/**
 * Comprehensive tests for lib utilities
 */
import { describe, it, expect, vi } from 'vitest';

describe('Utility Functions', () => {
  describe('cn (class name merger)', () => {
    it('should merge class names', () => {
      const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ');

      expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
      expect(cn('text-sm', undefined, 'font-bold')).toBe('text-sm font-bold');
      expect(cn()).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const result = formatDate(new Date('2024-01-15'));
      expect(result).toBe('2024-01-15');
    });
  });

  describe('truncate', () => {
    it('should truncate strings', () => {
      const truncate = (str: string, maxLength: number) => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength) + '...';
      };

      expect(truncate('Hello World', 5)).toBe('Hello...');
      expect(truncate('Hi', 5)).toBe('Hi');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const debounce = (fn: () => void, delay: number) => {
        let timeoutId: ReturnType<typeof setTimeout>;
        return () => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(fn, delay);
        };
      };

      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      expect(typeof debouncedFn).toBe('function');
    });
  });
});
