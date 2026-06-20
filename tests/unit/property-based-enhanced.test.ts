/**
 * Enhanced property-based tests using fast-check
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { parseNaturalLanguage } from '../../src/lib/nlp';
import { sanitizeInput } from '../../src/lib/sanitize';

describe('Property-Based Tests - Enhanced', () => {
  describe('Natural Language Parsing', () => {
    it('should always return a result with title', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = parseNaturalLanguage(input);
          expect(result.title).toBeDefined();
          expect(typeof result.title).toBe('string');
        })
      );
    });

    it('should handle very long input', () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 10000 }), (input) => {
          const result = parseNaturalLanguage(input);
          expect(result).toBeDefined();
        })
      );
    });
  });

  describe('Sanitization', () => {
    it('should never contain script tags after sanitization', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const sanitized = sanitizeInput(input);
          expect(sanitized).not.toContain('<script');
          expect(sanitized).not.toContain('</script>');
        })
      );
    });

    it('should return a string for any input', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const sanitized = sanitizeInput(input);
          expect(typeof sanitized).toBe('string');
        })
      );
    });
  });

  describe('Idempotent Operations', () => {
    it('should produce same result for same input', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result1 = parseNaturalLanguage(input);
          const result2 = parseNaturalLanguage(input);
          expect(result1.title).toBe(result2.title);
        })
      );
    });
  });
});