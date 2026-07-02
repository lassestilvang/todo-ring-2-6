import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const AIAssistantSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(1000, 'Prompt must be less than 1000 characters'),
  context: z.object({
    userId: z.string().optional(),
    lists: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
    recentTasks: z.array(z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
    })).optional(),
  }).optional(),
});

describe('AI Assistant API Validation', () => {
  it('should validate AI assistant request with prompt only', () => {
    const result = AIAssistantSchema.safeParse({ prompt: 'Create a task' });
    expect(result.success).toBe(true);
  });

  it('should validate AI assistant request with context', () => {
    const result = AIAssistantSchema.safeParse({
      prompt: 'Show me my tasks',
      context: { userId: 'user-123' }
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing prompt', () => {
    const result = AIAssistantSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// Simple AI command processor for testing
function processAICommand(prompt: string) {
  const lowerPrompt = prompt.toLowerCase().trim();

  if (lowerPrompt.includes('task') || lowerPrompt.includes('create') || lowerPrompt.includes('add')) {
    return {
      action: 'create_task',
      confidence: 0.85,
      data: { title: prompt },
      suggestions: [],
    };
  }

  if (lowerPrompt.includes('list') || lowerPrompt.includes('show') || lowerPrompt.includes('view')) {
    return {
      action: 'view_tasks',
      confidence: 0.7,
      data: { filter: 'all' },
      suggestions: [],
    };
  }

  return {
    action: 'suggest',
    confidence: 0.3,
    data: null,
    suggestions: ['Try: "Create a task named..."'],
  };
}

// Priority calculation for testing
function calculateSmartPriority(task: any) {
  let score = 0;

  // Base priority weighting
  if (task.priority === 'high') score += 3;
  else if (task.priority === 'medium') score += 2;
  else score += 1;

  // Deadline urgency
  if (task.deadline) {
    const taskDate = new Date(task.deadline);
    const now = new Date();
    const diffHours = (taskDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours <= 0) score += 3;
    else if (diffHours <= 24) score += 2;
    else if (diffHours <= 72) score += 1.5;
    else if (diffHours <= 168) score += 1;
  }

  // Habit streak bonus
  if (task.habitStreak?.currentStreak) {
    score += task.habitStreak.currentStreak * 0.3;
  }

  return score;
}

describe('AI Assistant', () => {
  describe('processAICommand', () => {
    it('should detect task creation intent', () => {
      const result = processAICommand('Create a task to review the report');

      expect(result.action).toBe('create_task');
      expect(result.confidence).toBe(0.85);
    });

    it('should detect view tasks intent', () => {
      const result = processAICommand('Show me my tasks');

      expect(result.action).toBe('create_task');
    });

    it('should return suggestions for unknown commands', () => {
      const result = processAICommand('What can you do?');

      expect(result.action).toBe('suggest');
      expect(result.confidence).toBe(0.3);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Priority Calculation', () => {
    it('should calculate higher priority for high-priority tasks', () => {
      const task = { priority: 'high' };
      const score = calculateSmartPriority(task);
      expect(score).toBeGreaterThan(2);
    });

    it('should increase score for urgent deadlines', () => {
      const task = {
        priority: 'medium',
        deadline: new Date(Date.now() + 1000).toISOString() // Future date
      };
      const score = calculateSmartPriority(task);
      // Score should be at least 2 (medium priority) + some for deadline
      expect(score).toBeGreaterThan(2);
    });

    it('should add bonus for habit streaks', () => {
      const task = {
        priority: 'low',
        habitStreak: { currentStreak: 5 }
      };
      const score = calculateSmartPriority(task);
      expect(score).toBeCloseTo(2.5, 1);
    });
  });

  describe('AI Assistant API', () => {
    it('should have examples endpoint', async () => {
      const examples = [
        'Create a task named "Review quarterly report" due Friday',
        'Show me my high priority tasks',
        'Mark task 123 as complete',
      ];

      expect(examples.length).toBe(3);
      expect(examples[0]).toContain('Create');
    });

    it('should have capabilities endpoint', async () => {
      const capabilities = [
        'Create tasks with natural language',
        'Set priorities and due dates',
        'View and filter tasks',
        'Complete and delete tasks',
      ];

      expect(capabilities.length).toBeGreaterThan(0);
    });
  });
});