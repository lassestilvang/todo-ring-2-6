/**
 * Comprehensive tests for src/lib/sanitize.ts
 */
import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  sanitizeObject,
  sanitizeString,
  sanitizeNumber,
  sanitizeUuid,
  sanitizeDate,
} from '../../src/lib/sanitize';

describe('Sanitize Module - Comprehensive', () => {
  describe('sanitizeInput', () => {
    it('should sanitize XSS script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
    });

    it('should allow safe HTML tags', () => {
      const input = '<b>bold</b> <i>italic</i> <strong>strong</strong>';
      const result = sanitizeInput(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
      expect(result).toContain('<strong>');
    });

    it('should strip dangerous tags like iframe', () => {
      const input = '<iframe src="evil.com"></iframe>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<iframe');
    });

    it('should handle empty string', () => {
      const result = sanitizeInput('');
      expect(result).toBe('');
    });

    it('should handle already safe content', () => {
      const input = 'Just plain text';
      const result = sanitizeInput(input);
      expect(result).toBe('Just plain text');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const obj = { name: '<script>evil</script>John' };
      const result = sanitizeObject(obj);
      expect(result.name).not.toContain('<script>');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          profile: {
            bio: '<script>alert(1)</script>Developer'
          }
        }
      };
      const result = sanitizeObject(obj);
      expect(result.user.profile.bio).not.toContain('<script>');
    });

    it('should handle arrays', () => {
      const obj = {
        items: ['<script>alert(1)</script>', 'safe']
      };
      const result = sanitizeObject(obj);
      expect(result.items[0]).not.toContain('<script>');
    });

    it('should preserve non-string values', () => {
      const obj = { count: 42, active: true, data: null };
      const result = sanitizeObject(obj);
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.data).toBe(null);
    });

    it('should preserve array of non-strings', () => {
      const obj = { numbers: [1, 2, 3], flags: [true, false] };
      const result = sanitizeObject(obj);
      // Arrays are converted to objects by sanitizeObject
      expect(result.numbers[0]).toBe(1);
      expect(result.numbers[1]).toBe(2);
      expect(result.numbers[2]).toBe(3);
    });
  });

  describe('sanitizeString', () => {
    it('should return trimmed string', () => {
      const result = sanitizeString('  hello  ');
      expect(result).toBe('hello');
    });

    it('should throw error for required field that is null', () => {
      expect(() => sanitizeString(null, { required: true })).toThrow('This field is required');
    });

    it('should throw error for required field that is undefined', () => {
      expect(() => sanitizeString(undefined, { required: true })).toThrow('This field is required');
    });

    it('should return default value for null when not required', () => {
      const result = sanitizeString(null, { defaultValue: 'default' });
      expect(result).toBe('default');
    });

    it('should throw error when max length exceeded', () => {
      expect(() => sanitizeString('a very long string', { max: 5 })).toThrow('Maximum length is 5 characters');
    });

    it('should accept string at max length', () => {
      const result = sanitizeString('hello', { max: 5 });
      expect(result).toBe('hello');
    });

    it('should sanitize the string', () => {
      const result = sanitizeString('<script>evil</script>hello');
      expect(result).not.toContain('<script>');
    });

    it('should handle number input', () => {
      const result = sanitizeString(123);
      expect(result).toBe('123');
    });
  });

  describe('sanitizeNumber', () => {
    it('should convert string to number', () => {
      const result = sanitizeNumber('42');
      expect(result).toBe(42);
    });

    it('should throw error for invalid number', () => {
      expect(() => sanitizeNumber('not a number')).toThrow('Invalid number');
    });

    it('should throw error for required field that is null', () => {
      expect(() => sanitizeNumber(null, { required: true })).toThrow('This field is required');
    });

    it('should throw error for required field that is undefined', () => {
      expect(() => sanitizeNumber(undefined, { required: true })).toThrow('This field is required');
    });

    it('should return default value for null when not required', () => {
      const result = sanitizeNumber(null, { defaultValue: 10 });
      expect(result).toBe(10);
    });

    it('should throw error when number is below min', () => {
      expect(() => sanitizeNumber(5, { min: 10 })).toThrow('Minimum value is 10');
    });

    it('should throw error when number is above max', () => {
      expect(() => sanitizeNumber(15, { max: 10 })).toThrow('Maximum value is 10');
    });

    it('should accept number at min value', () => {
      const result = sanitizeNumber(10, { min: 10 });
      expect(result).toBe(10);
    });

    it('should accept number at max value', () => {
      const result = sanitizeNumber(10, { max: 10 });
      expect(result).toBe(10);
    });

    it('should return 0 for null when no default', () => {
      const result = sanitizeNumber(null);
      expect(result).toBe(0);
    });
  });

  describe('sanitizeUuid', () => {
    it('should validate and return a valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = sanitizeUuid(uuid);
      expect(result).toBe(uuid);
    });

    it('should return null for invalid UUID', () => {
      const result = sanitizeUuid('not-a-uuid');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = sanitizeUuid(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = sanitizeUuid(undefined);
      expect(result).toBeNull();
    });

    it('should handle uppercase UUID', () => {
      const uuid = '123E4567-E89B-12D3-A456-426614174000';
      const result = sanitizeUuid(uuid);
      // The function preserves the original case
      expect(result).toBe(uuid);
    });
  });

  describe('sanitizeDate', () => {
    it('should validate and return a valid date string', () => {
      const dateStr = '2024-01-15T10:30:00.000Z';
      const result = sanitizeDate(dateStr);
      expect(result).toBe(dateStr);
    });

    it('should return null for invalid date', () => {
      const result = sanitizeDate('not-a-date');
      expect(result).toBeNull();
    });

    it('should return null for null input', () => {
      const result = sanitizeDate(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = sanitizeDate(undefined);
      expect(result).toBeNull();
    });

    it('should handle various date formats', () => {
      const formats = [
        '2024-01-15',
        '2024-01-15T10:30:00Z',
        'January 15, 2024',
        '15 Jan 2024',
      ];

      for (const format of formats) {
        const result = sanitizeDate(format);
        expect(result).not.toBeNull();
      }
    });
  });
});