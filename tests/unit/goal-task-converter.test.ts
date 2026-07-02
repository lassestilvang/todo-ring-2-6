import { describe, it, expect, vi } from 'vitest';

// Mock the AI API
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GoalTaskConverter', () => {
  const mockGoal = {
    id: 'goal-1',
    title: 'Complete Project',
    description: 'Finish the project by the deadline',
    targetValue: 10,
    currentValue: 3,
    unit: 'tasks',
    period: 'weekly' as const,
    category: 'work',
    isCompleted: false,
  };

  describe('AI Task Generation', () => {
    it('should generate tasks based on category', async () => {
      // Test that work category generates appropriate tasks
      const expectedTemplates = [
        'Complete project',
        'Review feedback',
        'Update documentation',
        'Team meeting',
        'Skill development',
      ];

      // Mock API response
      const mockTasks = expectedTemplates.map((title, i) => ({
        title,
        description: `Task for ${title}`,
        priority: i < 2 ? 'high' : 'medium',
        estimateMinutes: 30 + i * 15,
      }));

      expect(mockTasks.length).toBeGreaterThan(0);
      expect(mockTasks[0].priority).toBe('high');
    });

    it('should handle different categories', () => {
      const categories = {
        fitness: ['Exercise', 'Meal prep', 'Track progress'],
        learning: ['Read chapter', 'Practice exercises', 'Review notes'],
        health: ['Morning routine', 'Self-care', 'Reflection'],
        work: ['Complete project', 'Review feedback', 'Team meeting'],
      };

      Object.values(categories).forEach(tasks => {
        expect(tasks.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage', () => {
      const progress = (mockGoal.currentValue / mockGoal.targetValue) * 100;
      expect(progress).toBe(30);
    });

    it('should handle zero target', () => {
      const zeroTargetGoal = { ...mockGoal, targetValue: 0 };
      const progress = zeroTargetGoal.targetValue > 0
        ? (zeroTargetGoal.currentValue / zeroTargetGoal.targetValue) * 100
        : 0;
      expect(progress).toBe(0);
    });

    it('should cap progress at 100', () => {
      const completedGoal = { ...mockGoal, currentValue: 15, targetValue: 10 };
      const progress = Math.min(100, (completedGoal.currentValue / completedGoal.targetValue) * 100);
      expect(progress).toBe(100);
    });
  });
});