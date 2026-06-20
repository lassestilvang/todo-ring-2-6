import { describe, it, expect } from 'vitest';
import { parseNaturalLanguage } from '../../src/lib/nlp';

describe('NLP Edge Cases', () => {
  it('should handle unknown words in addDaysWord', () => {
    const result = parseNaturalLanguage('Task on xyz123');
    expect(result.title).toBeDefined();
  });

  it('should handle multiple exclamation marks', () => {
    const result = parseNaturalLanguage('Task!!!');
    expect(result.priority).toBe('high');
  });

  it('should handle 12am time', () => {
    const result = parseNaturalLanguage('Meeting at 12am');
    expect(result.time).toBe('00:00');
  });

  it('should handle 12pm time', () => {
    const result = parseNaturalLanguage('Meeting at 12pm');
    expect(result.time).toBe('12:00');
  });

  it('should handle time without am/pm', () => {
    const result = parseNaturalLanguage('Call at 1500');
    // Should not set time without am/pm
    expect(result.time).toBeUndefined();
  });

  it('should handle deadline with ISO date', () => {
    const result = parseNaturalLanguage('Deadline: 2024-12-25');
    expect(result.deadline).toBe('2024-12-25');
  });

  it('should handle empty string', () => {
    const result = parseNaturalLanguage('');
    expect(result.title).toBe('');
  });

  it('should handle only punctuation', () => {
    const result = parseNaturalLanguage('!!!');
    expect(result.priority).toBe('high');
  });

  describe('addDaysWord function branches', () => {
    it('should handle "by tomorrow" pattern', () => {
      const result = parseNaturalLanguage('Complete by tomorrow');
      expect(result.date).toBeDefined();
    });

    it('should handle "by today" pattern', () => {
      const result = parseNaturalLanguage('Complete by today');
      expect(result.date).toBeDefined();
    });

    it('should handle "by next week" pattern', () => {
      const result = parseNaturalLanguage('Submit by next week');
      expect(result.date).toBeDefined();
    });

    it('should handle "by this weekend" pattern', () => {
      const result = parseNaturalLanguage('Finish by this weekend');
      expect(result.date).toBeDefined();
    });

    it('should handle specific day names (monday-sunday)', () => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        const result = parseNaturalLanguage(`Meeting on ${day}`);
        expect(result.date).toBeDefined();
      }
    });

    it('should handle unknown words gracefully', () => {
      const result = parseNaturalLanguage('Task on unknownword123');
      expect(result.title).toBeDefined();
    });

    it('should handle "by monday" pattern', () => {
      const result = parseNaturalLanguage('Meeting by monday');
      expect(result.date).toBeDefined();
    });

    it('should handle "by tuesday" through "by sunday"', () => {
      const days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        const result = parseNaturalLanguage(`Event by ${day}`);
        expect(result.date).toBeDefined();
      }
    });

    it('should handle deadline with non-ISO date word', () => {
      const result = parseNaturalLanguage('Deadline: tomorrow');
      expect(result.deadline).toBeDefined();
    });

    it('should handle deadline with specific day name', () => {
      const result = parseNaturalLanguage('Deadline: monday');
      expect(result.deadline).toBeDefined();
    });
  });

  describe('next_week and this_weekend patterns', () => {
    it('should parse "by next week" pattern correctly', () => {
      const result = parseNaturalLanguage('Submit by next week');
      expect(result.date).toBeDefined();
    });

    it('should parse "by this weekend" pattern correctly', () => {
      const result = parseNaturalLanguage('Finish by this weekend');
      expect(result.date).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle completely unknown words', () => {
      const result = parseNaturalLanguage('Task xyz123abc');
      expect(result.title).toBeDefined();
    });
  });
});
