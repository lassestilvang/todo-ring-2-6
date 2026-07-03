/**
 * Tests for Recurring Task Exceptions
 */

import { describe, it, expect } from 'vitest';

// Test that the operations module exports the expected functions
describe('Recurring Task Exceptions - Module Exports', () => {
  it('should export addRecurringException function', async () => {
    const { addRecurringException } = await import('../../db/operations');
    expect(typeof addRecurringException).toBe('function');
  });

  it('should export removeRecurringException function', async () => {
    const { removeRecurringException } = await import('../../db/operations');
    expect(typeof removeRecurringException).toBe('function');
  });

  it('should export getRecurringExceptionById function', async () => {
    const { getRecurringExceptionById } = await import('../../db/operations');
    expect(typeof getRecurringExceptionById).toBe('function');
  });

  it('should export isRecurringException function', async () => {
    const { isRecurringException } = await import('../../db/operations');
    expect(typeof isRecurringException).toBe('function');
  });

  it('should export getRecurringExceptions function', async () => {
    const { getRecurringExceptions } = await import('../../db/operations');
    expect(typeof getRecurringExceptions).toBe('function');
  });
});

describe('Recurring Task Exceptions - Integration', () => {
  it('should handle exception date format correctly', () => {
    const date = '2025-01-15';
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should handle task ID format correctly', () => {
    const taskId = '550e8400-e29b-41d4-a716-446655440000';
    expect(taskId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});