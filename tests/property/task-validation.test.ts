// tests/property/task-validation.test.ts
import fc from 'fast-check';
import { z } from 'zod';

// Mock Task type for validation
const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(0),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).nullable(),
  estimateHours: z.number().int().positive().min(1).max(24).nullable(),
  estimateMinutes: z.number().int().positive().min(1).max(59).nullable(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
  list_id: z.string(),
  recurringType: z.string().nullable(),
  recurringInterval: z.number().int().positive().nullable(),
  isAllDay: z.boolean().nullable(),
};

/**
 * Property-based validation test for Task schema
 */
describe('Task Schema Validation', () => {
  // Property 1: Valid tasks should pass validation
  fc.assert(
    fc.property(
      fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 200 }),
        description: fc.string().maxLength(1000),
        priority: fc.constantFrom('low', 'medium', 'high'),
        status: fc.constantFrom('pending', 'in_progress', 'completed', 'cancelled'),
        date: fc.date().map(d => d.toISOString().split('T')[0]),
        completedAt: fc.option(fc.date().map(d => d.toISOString().split('T')[0])),
        estimateHours: fc.nat({ max: 24 }),
        estimateMinutes: fc.nat({ max: 59 }),
        createdAt: fc.date().map(d => d.toISOString()),
        updatedAt: fc.date().map(d => d.toISOString()),
        list_id: fc.uuid(),
        recurringType: fc.constantFrom('none', 'daily', 'weekly', 'monthly', 'yearly'),
        recurringInterval: fc.option(fc.nat({ min: 1 })),
        isAllDay: fc.boolean(),
      }),
      (task) => {
        // When schema validates the record, it should be successful
        const result = TaskSchema.safeParse(task);
        expect(result.success).toBe(true);

        // Verify all required fields exist and are non-empty
        if (result.success) {
          expect(result.data.id).toBeDefined();
          expect(result.data.title).toBeDefined();
          expect(result.data.list_id).toBeDefined();
          expect(result.data.date).toBeDefined();
          expect(result.data.createdAt).toBeDefined();
          expect(result.data.updatedAt).toBeDefined();
        }
      }
    )
  );

  // Property 2: Invalid tasks should be rejected
  fc.assert(
    fc.property(
      fc.string(), // Invalid priority
      (invalidPriority) => {
        // Create a task with an invalid priority
        const invalidTask = {
          id: fc.uuid(),
          title: 'Test Task',
          description: 'Test',
          priority: invalidPriority as any,  // Invalid priority
          status: 'pending',
          date: '2023-01-01',
        };

        // Validation should fail
        expect(() => {
          // Attempt to parse with invalid priority
          const result = TaskSchema.safeParse(invalidTask);

          // Should fail validation
          expect(result.success).toBe(false);

          if (result.error) {
            // Should have an error about invalid priority
            expect(result.error?.issues).toContainEqual(
              expect.objectContaining({ path: ['priority'] })
            );
          }
        });
      }
    )
  );