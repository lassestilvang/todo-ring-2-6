import { format, addDays } from 'date-fns';
import type { NaturalLanguageParseResult } from './validations';

/**
 * Parses natural language input to extract task details
 * Examples:
 * - "Meeting with John tomorrow at 2pm"
 * - "Review PR #123 next monday"
 * - "Call mom today"
 * - "Buy groceries by friday"
 */
export function parseNaturalLanguage(input: string): NaturalLanguageParseResult {
  const result: NaturalLanguageParseResult = {
    title: input,
  };

  const lowerInput = input.toLowerCase();

  // Priority detection
  if (lowerInput.includes('!!!') || lowerInput.includes('urgent') || lowerInput.includes('asap')) {
    result.priority = 'high';
  } else if (lowerInput.includes('!!') || lowerInput.includes('important')) {
    result.priority = 'medium';
  } else if (lowerInput.includes('!')) {
    result.priority = 'low';
  }

  // Date detection patterns
  const today = new Date();

  // Check for specific dates (YYYY-MM-DD or MM/DD/YYYY)
  const isoDateMatch = input.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoDateMatch) {
    result.date = isoDateMatch[1];
    result.title = input.replace(isoDateMatch[0], '').trim();
  }

  // Check for MM/DD/YYYY format
  const usDateMatch = input.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usDateMatch) {
    const month = usDateMatch[1];
    const day = usDateMatch[2];
    const year = usDateMatch[3];
    if (month && day && year) {
      result.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      result.title = input.replace(usDateMatch[0], '').trim();
    }
  }

  // Check for "by [date]" pattern
  const byDateMatch = input.match(/by\s+(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|this weekend)/i);
  if (byDateMatch) {
    const dateWord = byDateMatch[1]?.toLowerCase();
    if (dateWord) {
      result.date = addDaysWord(today, dateWord);
      result.title = input.replace(byDateMatch[0], '').replace(/^\s*by\s*/i, '').trim();
    }
  }

  // Check for day names
  const dayPatterns = [
    { pattern: /monday/g, value: 'monday' },
    { pattern: /tuesday/g, value: 'tuesday' },
    { pattern: /wednesday/g, value: 'wednesday' },
    { pattern: /thursday/g, value: 'thursday' },
    { pattern: /friday/g, value: 'friday' },
    { pattern: /saturday/g, value: 'saturday' },
    { pattern: /sunday/g, value: 'sunday' },
  ];

  for (const { pattern, value } of dayPatterns) {
    if (pattern.test(input)) {
      result.date = addDaysWord(today, value);
      result.title = input.replace(pattern, '').trim();
      break;
    }
  }

  // Time detection
  const timePattern = input.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timePattern && timePattern[1]) {
    const hours = parseInt(timePattern[1]);
    const minutes = parseInt(timePattern[2] || '0');
    let h = hours;
    const period = timePattern[3]?.toLowerCase();
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    result.time = `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    result.title = input.replace(timePattern[0], '').trim();
  }

  // "by [date]" for deadline
  const deadlineMatch = input.match(/deadline:\s*(tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{4}-\d{2}-\d{2})/i);
  if (deadlineMatch) {
    const dateWord = deadlineMatch[1];
    if (dateWord) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateWord)) {
        result.deadline = dateWord;
      } else {
        result.deadline = addDaysWord(today, dateWord.toLowerCase());
      }
      result.title = input.replace(deadlineMatch[0], '').trim();
    }
  }

  // Clean up title
  result.title = result.title
    .replace(/^\s*[.!?]\s*/, '')
    .replace(/\s+[.!?]$/, '')
    .trim();

  if (!result.title) {
    result.title = input.trim();
  }

  return result;
}

function addDaysWord(_base: Date, word: string): string {
  const today = new Date();
  const dayMap: Record<string, number> = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6,
  };

  // Normalize "next week" and "this weekend" to underscore format
  const normalizedWord = word.replace(/\s+/g, '_');

  switch (normalizedWord) {
    case 'today':
      return format(today, 'yyyy-MM-dd');
    case 'tomorrow': {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return format(tomorrow, 'yyyy-MM-dd');
    }
    case 'next_week': {
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      return format(nextWeek, 'yyyy-MM-dd');
    }
    case 'this_weekend': {
      const saturday = new Date(today);
      saturday.setDate(saturday.getDate() + (6 - saturday.getDay()));
      return format(saturday, 'yyyy-MM-dd');
    }
    default: {
      if (dayMap[word] !== undefined) {
        const targetDay = dayMap[word];
        const diff = (targetDay + 7 - today.getDay()) % 7;
        const nextDay = new Date(today);
        nextDay.setDate(today.getDate() + (diff === 0 ? 7 : diff));
        return format(nextDay, 'yyyy-MM-dd');
      }
      return format(today, 'yyyy-MM-dd');
    }
  }
}

/**
 * Advanced search query parser
 * Supports:
 * - Phrase search: "exact phrase"
 * - Boolean operators: AND, OR, NOT
 * - Field filters: title:, description:, priority:, status:
 * - Excludes: -term
 */
export interface SearchQuery {
  raw: string;
  phrases: string[];
  terms: string[];
  excludes: string[];
  filters: Record<string, string>;
}

export function parseSearchQuery(query: string): SearchQuery {
  const result: SearchQuery = {
    raw: query,
    phrases: [],
    terms: [],
    excludes: [],
    filters: {},
  };

  let remaining = query;

  // Extract field filters first
  const filterPatterns = [
    { key: 'title', pattern: /title:(\S+)/i },
    { key: 'description', pattern: /description:(\S+)/i },
    { key: 'priority', pattern: /priority:(high|medium|low|none)/i },
    { key: 'status', pattern: /status:(pending|in_progress|completed|cancelled)/i },
  ];

  for (const { key, pattern } of filterPatterns) {
    const match = remaining.match(pattern);
    if (match) {
      result.filters[key] = match[1].toLowerCase();
      remaining = remaining.replace(pattern, '').trim();
    }
  }

  // Extract quoted phrases
  const phrasePattern = /"([^"]+)"/g;
  let phraseMatch;
  while ((phraseMatch = phrasePattern.exec(remaining)) !== null) {
    result.phrases.push(phraseMatch[1]);
  }

  // Remove phrases from remaining
  remaining = remaining.replace(phrasePattern, ' ');

  // Extract excluded terms (prefixed with -)
  const excludePattern = /-(\S+)/g;
  let excludeMatch;
  while ((excludeMatch = excludePattern.exec(remaining)) !== null) {
    result.excludes.push(excludeMatch[1].toLowerCase());
  }

  // Remove excludes from remaining
  remaining = remaining.replace(excludePattern, ' ');

  // Extract remaining terms
  const terms = remaining.split(/\s+/).filter(t => t.length > 0 && !t.startsWith('"'));
  result.terms = terms.map(t => t.replace(/\*/g, '').toLowerCase());

  return result;
}