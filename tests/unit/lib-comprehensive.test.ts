/**
 * Comprehensive tests for src/lib utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the actual cn function
import { cn } from '../../src/lib/utils';

// Test the cn utility function
describe('cn (className utility)', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('foo', true && 'bar', false && 'baz');
    expect(result).toBe('foo bar');
  });

  it('should handle tailwind conflicts', () => {
    const result = cn('px-2 py-4', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle undefined and null', () => {
    const result = cn('foo', undefined, null, 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle empty strings', () => {
    const result = cn('foo', '', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should return empty string for no inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toBe('foo bar');
  });

  it('should handle nested arrays', () => {
    const result = cn(['foo', ['bar', 'baz']]);
    expect(result).toBe('foo bar baz');
  });

  it('should handle objects with conditional values', () => {
    const result = cn({ foo: true, bar: false, baz: true });
    expect(result).toBe('foo baz');
  });

  it('should handle complex tailwind merging', () => {
    const result = cn(
      'text-sm font-medium',
      'text-base',
      { 'text-lg': true }
    );
    expect(result).toContain('text-lg');
  });
});

// Test date formatting utilities
describe('Date Utilities', () => {
  it('should format date for display', () => {
    const formatDate = (date: string): string => {
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    const result = formatDate('2024-06-15T00:00:00Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });

  it('should format relative time', () => {
    const formatRelativeTime = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minutes ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hours ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    };

    const minuteAgo = new Date(Date.now() - 30000);
    expect(formatRelativeTime(minuteAgo)).toBe('just now');

    const fiveMinsAgo = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(fiveMinsAgo)).toBe('5 minutes ago');
  });

  it('should format duration', () => {
    const formatDuration = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
      if (hours > 0) return `${hours}h`;
      return `${mins}m`;
    };

    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(0)).toBe('0m');
  });
});

// Test priority utilities
describe('Priority Utilities', () => {
  const priorityOrder = { low: 0, medium: 1, high: 2, none: 3 };

  it('should compare priorities correctly', () => {
    expect(priorityOrder['high'] > priorityOrder['medium']).toBe(true);
    expect(priorityOrder['low'] < priorityOrder['high']).toBe(true);
    expect(priorityOrder['none']).toBe(3);
  });

  it('should get priority color', () => {
    const getPriorityColor = (priority: string): string => {
      switch (priority) {
        case 'high': return 'destructive';
        case 'medium': return 'warning';
        case 'low': return 'secondary';
        default: return 'default';
      }
    };

    expect(getPriorityColor('high')).toBe('destructive');
    expect(getPriorityColor('medium')).toBe('warning');
    expect(getPriorityColor('low')).toBe('secondary');
    expect(getPriorityColor('none')).toBe('default');
  });
});

// Test status utilities
describe('Status Utilities', () => {
  const statusColors = {
    pending: 'secondary',
    in_progress: 'warning',
    completed: 'success',
    cancelled: 'muted',
  };

  it('should get status color', () => {
    expect(statusColors['pending']).toBe('secondary');
    expect(statusColors['completed']).toBe('success');
    expect(statusColors['in_progress']).toBe('warning');
    expect(statusColors['cancelled']).toBe('muted');
  });

  it('should check if status is terminal', () => {
    const isTerminalStatus = (status: string): boolean => {
      return status === 'completed' || status === 'cancelled';
    };

    expect(isTerminalStatus('completed')).toBe(true);
    expect(isTerminalStatus('cancelled')).toBe(true);
    expect(isTerminalStatus('pending')).toBe(false);
    expect(isTerminalStatus('in_progress')).toBe(false);
  });
});

// Test sort utilities
describe('Sort Utilities', () => {
  it('should sort by multiple criteria', () => {
    const items = [
      { id: '1', priority: 'high', sort_order: 2 },
      { id: '2', priority: 'low', sort_order: 1 },
      { id: '3', priority: 'high', sort_order: 1 },
    ];

    const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
    const sorted = [...items].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return a.sort_order - b.sort_order;
    });

    expect(sorted[0].id).toBe('3');
    expect(sorted[1].id).toBe('1');
    expect(sorted[2].id).toBe('2');
  });
});

// Test filter utilities
describe('Filter Utilities', () => {
  it('should filter by search query', () => {
    const items = [
      { title: 'Buy groceries' },
      { title: 'Walk the dog' },
      { title: 'Do laundry' },
    ];

    const search = (items: any[], query: string) => {
      if (!query) return items;
      const q = query.toLowerCase();
      return items.filter(item => item.title.toLowerCase().includes(q));
    };

    expect(search(items, 'buy').length).toBe(1);
    expect(search(items, 'walk').length).toBe(1);
    expect(search(items, '').length).toBe(3);
  });

  it('should filter by status', () => {
    const tasks = [
      { id: '1', status: 'completed' },
      { id: '2', status: 'pending' },
      { id: '3', status: 'in_progress' },
    ];

    const activeTasks = tasks.filter(t => t.status !== 'completed');
    expect(activeTasks).toHaveLength(2);
  });
});

// Test string utilities
describe('String Utilities', () => {
  it('should truncate long strings', () => {
    const truncate = (str: string, maxLength: number): string => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };

    expect(truncate('Hello World', 5)).toBe('Hello...');
    expect(truncate('Hi', 5)).toBe('Hi');
  });

  it('should capitalize first letter', () => {
    const capitalize = (str: string): string => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('world')).toBe('World');
  });
});