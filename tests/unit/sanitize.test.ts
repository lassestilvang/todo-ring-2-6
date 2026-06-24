import { describe, it, expect } from 'vitest';
import { sanitizeInput, sanitizeObject, sanitizeString, sanitizeNumber, sanitizeUuid, sanitizeDate } from '../../src/lib/sanitize';

describe('Sanitization', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should allow safe HTML tags', () => {
      const input = '<strong>Bold</strong> and <em>italic</em>';
      const result = sanitizeInput(input);
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize string values', () => {
      const obj = { name: '<script>alert(1)</script>John', age: 25 };
      const result = sanitizeObject(obj);
      expect(result.name).not.toContain('<script>');
      expect(result.age).toBe(25);
    });

    it('should handle nested objects', () => {
      const obj = { user: { name: '<b>John</b>' } };
      const result = sanitizeObject(obj);
      expect(result.user.name).toContain('<b>');
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize and trim strings', () => {
      const result = sanitizeString('  <script>xss</script>Hello  ');
      expect(result).toBe('Hello');
    });

    it('should throw on max length violation', () => {
      expect(() => sanitizeString('a'.repeat(200), { max: 100 })).toThrow();
    });

    it('should return default for undefined', () => {
      expect(sanitizeString(undefined, { defaultValue: 'default' })).toBe('default');
    });

    it('should return empty string when no default provided', () => {
      expect(sanitizeString(undefined)).toBe('');
    });

    it('should throw for undefined when required', () => {
      expect(() => sanitizeString(undefined, { required: true })).toThrow('This field is required');
    });
  });

  describe('sanitizeNumber', () => {
    it('should parse numbers', () => {
      expect(sanitizeNumber('42')).toBe(42);
      expect(sanitizeNumber(10)).toBe(10);
    });

    it('should throw on invalid numbers', () => {
      expect(() => sanitizeNumber('abc')).toThrow();
    });

    it('should enforce min/max', () => {
      expect(() => sanitizeNumber(5, { min: 10 })).toThrow();
      expect(() => sanitizeNumber(100, { max: 50 })).toThrow();
    });
  });

  describe('sanitizeUuid', () => {
    it('should validate UUIDs', () => {
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      expect(sanitizeUuid(valid)).toBe(valid);
    });

    it('should return null for invalid UUIDs', () => {
      expect(sanitizeUuid('invalid')).toBeNull();
    });
  });

  describe('sanitizeDate', () => {
    it('should validate dates', () => {
      const result = sanitizeDate('2024-01-15');
      expect(result).toBe('2024-01-15');
    });

    it('should return null for invalid dates', () => {
      expect(sanitizeDate('invalid')).toBeNull();
    });
  });
});