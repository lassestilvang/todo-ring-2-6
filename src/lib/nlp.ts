import { format, addDays, addWeeks, addMonths } from 'date-fns';
import type { NaturalLanguageParseResult } from './validations';

/**
 * Parses natural language input to extract task details
 * Examples:
 * - "Meeting with John tomorrow at 2pm"
 * - "Review PR #123 next monday"
 * - "Call mom today"
 * - "Buy groceries by friday"
 * - "Every Tuesday and Thursday" (recurring)
 * - "Estimate 2h 30m" (time tracking)
 * - "everyday at 9am" (habit)
 */
export function parseNaturalLanguage(input: string): NaturalLanguageParseResult {
  const result: NaturalLanguageParseResult = {
    title: input,
  };

  const lowerInput = input.toLowerCase();

  // === Recurring Pattern Detection ===
  const recurringPatterns = [
    { pattern: /\b(every\s+day|daily|each\s+day)\b/i, value: 'daily' },
    { pattern: /\b(every\s+week|weekly|each\s+week)\b/i, value: 'weekly' },
    { pattern: /\b(every\s+month|monthly|each\s+month)\b/i, value: 'monthly' },
    { pattern: /\b(weekdays|weekday|Mondays?\s+to\s+Fridays?)\b/i, value: 'weekdays' },
    { pattern: /\b(every\s+year|yearly|annual|annually)\b/i, value: 'yearly' },
  ];

  for (const { pattern, value } of recurringPatterns) {
    if (pattern.test(input)) {
      result.recurringType = value;
      // Extract interval if specified (e.g., "every 2 days")
      const intervalMatch = input.match(/every\s+(\d+)\s+(day|week|month|year)/i);
      if (intervalMatch && intervalMatch[1]) {
        result.recurringInterval = intervalMatch[1];
      }
      break;
    }
  }

  // === Time Estimate Detection ===
  // Match patterns like "2h 30m", "Estimate 2h", "takes 30 minutes"
  const timeEstimatePatterns = input.match(/(?:estimate:?|takes?|about|~)?\s*(\d+)\s*(h|hr|hour|hours|m|min|mins|minute|minutes)/gi);
  if (timeEstimatePatterns) {
    for (const match of timeEstimatePatterns) {
      const hoursMatch = match.match(/(\d+)\s*(h|hr|hour|hours)/i);
      const minutesMatch = match.match(/(\d+)\s*(m|min|mins|minute|minutes)/i);
      if (hoursMatch && hoursMatch[1]) {
        result.estimateHours = (result.estimateHours || 0) + parseInt(hoursMatch[1], 10);
      }
      if (minutesMatch && minutesMatch[1]) {
        result.estimateMinutes = (result.estimateMinutes || 0) + parseInt(minutesMatch[1], 10);
      }
    }
    // Normalize minutes to hours if >= 60
    if (result.estimateMinutes && result.estimateMinutes >= 60) {
      result.estimateHours = (result.estimateHours || 0) + Math.floor(result.estimateMinutes / 60);
      result.estimateMinutes = result.estimateMinutes % 60;
    }
  }

  // === List Detection ===
  const listMatch = input.match(/#\s*(\w+)|^in\s+(my\s+)?(inbox|work|personal|shopping|projects?)\b/i);
  if (listMatch) {
    result.listId = listMatch[1] || listMatch[3];
    result.title = input.replace(listMatch[0], '').trim();
  }

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

/**
 * Smart Priority Prediction
 * Analyzes task content and context to suggest appropriate priority
 */
export function predictPriority(task: {
  title: string;
  description?: string;
  deadline?: string;
  estimateHours?: number;
  estimateMinutes?: number;
  date?: string;
}): 'high' | 'medium' | 'low' | 'none' {
  const text = `${task.title} ${task.description || ''}`.toLowerCase();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // High priority indicators
  const highPriorityKeywords = ['urgent', 'asap', 'critical', 'important', 'deadline', 'submit', 'due', 'emergency', 'crisis', 'blocker', 'release', 'launch', 'meeting', 'call', 'presentation'];
  if (highPriorityKeywords.some(k => text.includes(k))) {
    return 'high';
  }

  // Medium priority indicators
  const mediumPriorityKeywords = ['review', 'update', 'prepare', 'follow', 'feedback', 'discuss', 'plan', 'organize'];
  if (mediumPriorityKeywords.some(k => text.includes(k))) {
    return 'medium';
  }

  // Deadline-based priority
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const daysUntilDue = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 0) return 'high';
    if (daysUntilDue <= 2) return 'high';
    if (daysUntilDue <= 7) return 'medium';
  }

  // Date-based priority (today or tomorrow)
  if (task.date) {
    if (task.date === todayStr) return 'high';
    const taskDate = new Date(task.date);
    const daysUntil = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil <= 1) return 'high';
    if (daysUntil <= 3) return 'medium';
  }

  // Time estimate-based priority (longer tasks get higher priority)
  const totalMinutes = (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
  if (totalMinutes >= 120) return 'medium';
  if (totalMinutes >= 60) return 'low';

  return 'none';
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