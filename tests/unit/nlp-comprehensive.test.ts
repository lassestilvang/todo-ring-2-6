/**
 * Comprehensive tests for src/lib/nlp.ts
 */
import { describe, it, expect } from 'vitest';
import { parseNaturalLanguage, parseSearchQuery, SearchQuery } from '../../src/lib/nlp';
import type { NaturalLanguageParseResult } from '../../src/lib/validations';

describe('NLP Module - Comprehensive', () => {
  describe('parseNaturalLanguage', () => {
    it('should parse basic task', () => {
      const result = parseNaturalLanguage('Buy groceries');
      expect(result.title).toBe('Buy groceries');
    });

    it('should detect high priority with !!!', () => {
      const result = parseNaturalLanguage('Fix bug !!!');
      expect(result.priority).toBe('high');
    });

    it('should detect high priority with urgent', () => {
      const result = parseNaturalLanguage('Urgent task needed');
      expect(result.priority).toBe('high');
    });

    it('should detect high priority with asap', () => {
      const result = parseNaturalLanguage('ASAP response required');
      expect(result.priority).toBe('high');
    });

    it('should detect medium priority with !!', () => {
      const result = parseNaturalLanguage('Important task!!');
      expect(result.priority).toBe('medium');
    });

    it('should detect medium priority with important', () => {
      const result = parseNaturalLanguage('This is important');
      expect(result.priority).toBe('medium');
    });

    it('should detect low priority with single !', () => {
      const result = parseNaturalLanguage('Just a thought!');
      expect(result.priority).toBe('low');
    });

    it('should parse ISO date format', () => {
      const result = parseNaturalLanguage('Meeting on 2024-03-15');
      expect(result.date).toBe('2024-03-15');
      expect(result.title).not.toContain('2024-03-15');
    });

    it('should parse US date format MM/DD/YYYY', () => {
      const result = parseNaturalLanguage('Deadline 03/15/2024');
      expect(result.date).toBe('2024-03-15');
    });

    it('should parse "by tomorrow"', () => {
      const result = parseNaturalLanguage('Submit by tomorrow');
      expect(result.date).toBeDefined();
      expect(result.title).not.toContain('by tomorrow');
    });

    it('should parse "by today"', () => {
      const result = parseNaturalLanguage('Complete by today');
      expect(result.date).toBeDefined();
    });

    it('should parse "by next week"', () => {
      const result = parseNaturalLanguage('Plan by next week');
      expect(result.date).toBeDefined();
    });

    it('should parse "by this weekend"', () => {
      const result = parseNaturalLanguage('Finish by this weekend');
      expect(result.date).toBeDefined();
    });

    it('should parse day names', () => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        const result = parseNaturalLanguage(`Meeting on ${day}`);
        expect(result.date).toBeDefined();
      }
    });

    it('should parse time with AM/PM', () => {
      const result = parseNaturalLanguage('Meeting at 2pm');
      expect(result.time).toBe('14:00');
    });

    it('should parse time with AM', () => {
      const result = parseNaturalLanguage('Meeting at 9am');
      expect(result.time).toBe('09:00');
    });

    it('should parse time with minutes', () => {
      const result = parseNaturalLanguage('Meeting at 2:30pm');
      expect(result.time).toBe('14:30');
    });

    it('should parse 12am as midnight', () => {
      const result = parseNaturalLanguage('Meeting at 12am');
      expect(result.time).toBe('00:00');
    });

    it('should parse deadline pattern', () => {
      const result = parseNaturalLanguage('Task deadline: tomorrow');
      expect(result.deadline).toBeDefined();
    });

    it('should parse deadline with ISO date', () => {
      const result = parseNaturalLanguage('Task deadline: 2024-12-31');
      expect(result.deadline).toBe('2024-12-31');
    });

    it('should clean up title punctuation', () => {
      const result = parseNaturalLanguage('Buy milk!');
      // The function removes leading/trailing punctuation
      expect(result.title).toContain('Buy milk');
    });

    it('should handle empty input', () => {
      const result = parseNaturalLanguage('');
      expect(result.title).toBe('');
    });
  });

  describe('parseSearchQuery', () => {
    it('should parse basic query', () => {
      const result = parseSearchQuery('meeting');
      expect(result.terms).toContain('meeting');
      expect(result.raw).toBe('meeting');
    });

    it('should parse phrase search', () => {
      const result = parseSearchQuery('"exact phrase"');
      expect(result.phrases).toContain('exact phrase');
    });

    it('should parse multiple phrases', () => {
      const result = parseSearchQuery('"first phrase" and "second phrase"');
      expect(result.phrases).toHaveLength(2);
    });

    it('should parse title filter', () => {
      const result = parseSearchQuery('title:meeting');
      expect(result.filters.title).toBe('meeting');
    });

    it('should parse description filter', () => {
      const result = parseSearchQuery('description:important');
      expect(result.filters.description).toBe('important');
    });

    it('should parse priority filter', () => {
      const result = parseSearchQuery('priority:high');
      expect(result.filters.priority).toBe('high');
    });

    it('should parse status filter', () => {
      const result = parseSearchQuery('status:pending');
      expect(result.filters.status).toBe('pending');
    });

    it('should parse excluded terms', () => {
      const result = parseSearchQuery('task -meeting -call');
      expect(result.excludes).toContain('meeting');
      expect(result.excludes).toContain('call');
    });

    it('should combine filters and terms', () => {
      const result = parseSearchQuery('title:project priority:high "important task"');
      expect(result.filters.title).toBe('project');
      expect(result.filters.priority).toBe('high');
      expect(result.phrases).toContain('important task');
    });

    it('should handle empty query', () => {
      const result = parseSearchQuery('');
      expect(result.terms).toHaveLength(0);
      expect(result.phrases).toHaveLength(0);
    });

    it('should remove wildcard characters', () => {
      const result = parseSearchQuery('task*');
      expect(result.terms).toContain('task');
      expect(result.terms[0]).not.toContain('*');
    });

    it('should handle case-insensitive filters', () => {
      const result = parseSearchQuery('TITLE:project PRIORITY:HIGH');
      expect(result.filters.title).toBe('project');
      expect(result.filters.priority).toBe('high');
    });
  });
});