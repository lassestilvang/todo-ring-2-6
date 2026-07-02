// tests/property/task-validation.test.ts
import { z } from 'zod';

// Mock Task type for validation
const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedAt: z.string().nullable().optional(),
  estimateHours: z.number().int().min(0).max(24).optional(),
  estimateMinutes: z.number().int().min(0).max(59).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  list_id: z.string(),
  recurringType: z.string().optional(),
  recurringInterval: z.string().optional(),
  isAllDay: z.boolean().optional(),
});

/**
 * Schema validation tests for Task schema
 */
describe('Task Schema Validation', () => {
  // Test 1: Valid tasks should pass validation
  it('should validate valid task objects', () => {
    const validTask = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
      title: 'Test Task',
      description: 'Test description',
      priority: 'high',
      status: 'pending',
      date: '2024-01-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      list_id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
    };

    const result = TaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBeDefined();
      expect(result.data.title).toBeDefined();
      expect(result.data.list_id).toBeDefined();
      expect(result.data.date).toBeDefined();
      expect(result.data.createdAt).toBeDefined();
      expect(result.data.updatedAt).toBeDefined();
    }
  });

  // Test 2: Invalid tasks should be rejected
  it('should reject tasks with invalid priority', () => {
    const invalidTask = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
      title: 'Test Task',
      description: 'Test',
      priority: 'invalid_priority',  // Invalid priority
      status: 'pending',
      date: '2023-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      list_id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
    };

    const result = TaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error?.issues.some(issue => issue.path.includes('priority'))).toBe(true);
    }
  });

  // Test 3: Empty title should be rejected
  it('should reject tasks with empty title', () => {
    const invalidTask = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
      title: '',  // Empty title
      priority: 'medium',
      status: 'pending',
      date: '2023-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      list_id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
    };

    const result = TaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
  });

  // Test 4: Invalid status should be rejected
  it('should reject tasks with invalid status', () => {
    const invalidTask = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
      title: 'Test Task',
      priority: 'medium',
      status: 'invalid_status',  // Invalid status
      date: '2023-01-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      list_id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
    };

    const result = TaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
  });
});