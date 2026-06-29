// tests/unit/property/task-properties.test.ts
import fc from 'fast-check';
import { Task } from '@/types/index';

describe('Task property-based testing', () => {
  fc.configureGlobal({ seed: Date.now() });

  const validTask = fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    description: fc.string({ maxLength: 1000 }).optional(),
    list_id: fc.uuid(),
    date: fc.date().map(d => d.toISOString().split('T')[0]),
    completedAt: fc.option(fc.date().map(d => d.toISOString())),
    priority: fc.constantFrom('low', 'medium', 'high'),
    status: fc.constantFrom('pending', 'in_progress', 'completed', 'cancelled'),
    estimateHours: fc.option(fc.nat({ max: 24 })),
    estimateMinutes: fc.option(fc.nat({ max: 59 })),
    createdAt: fc.date().map(d => d.toISOString()),
    updatedAt: fc.date().map(d => d.toISOString()),
    recurringType: fc.constantFrom('none', 'daily', 'weekly', 'monthly', 'yearly'),
    recurringInterval: fc.option(fc.nat({ max: 365 })),
    isAllDay: fc.boolean(),
  });

  it('should generate valid task objects', () => {
    fc.assert(
      fc.property(validTask, (task) => {
        // Validate required fields
        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('list_id');
        expect(task).toHaveProperty('date');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('status');
        expect(task).toHaveProperty('createdAt');
        expect(task).toHaveProperty('updatedAt');
        expect(task).toHaveProperty('isAllDay');

        // Validate date formats
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        expect(task.date).toMatch(dateRegex);
        if (task.completedAt) {
          expect(task.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }

        // Validate status enum
        expect(['pending', 'in_progress', 'completed', 'cancelled']).toContain(task.status);

        // Validate priority enum
        expect(['low', 'medium', 'high']).toContain(task.priority);

        // Validate recurring type
        expect(['none', 'daily', 'weekly', 'monthly', 'yearly']).toContain(task.recurringType);

        // If recurring, validate interval makes sense
        if (task.recurringType !== 'none') {
          expect(task.recurringInterval).toBeDefined();
          expect(typeof task.recurringInterval === 'number').toBe(true);
          expect(task.recurringInterval).toBeGreaterThan(0);
        }
      })
    );
  });

  it('should handle edge cases in task creation', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 0, maxLength: 0 }), // Empty title
          fc.uuid(),
          fc.date().map(d => d.toISOString().split('T')[0])
        ),
        (title, list_id, date) => {
          // Empty title should be invalid
          expect(title.length > 0).toBe(true);
        }
      )
    );
  });
});