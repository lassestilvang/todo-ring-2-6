/**
 * Goal Logic Tests
 * Tests for goal progress calculations
 */

import { describe, it, expect } from 'vitest';

interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  color: string;
  currentValue: number;
  isCompleted: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// Get goal progress
function getGoalProgress(goal: Goal): { current: number; target: number; percentage: number; isCompleted: boolean } {
  const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  return {
    current: goal.currentValue,
    target: goal.targetValue,
    percentage,
    isCompleted: goal.isCompleted,
  };
}

// Update goal progress
function updateGoalProgress(goal: Goal, increment: number): Goal {
  const newValue = Math.min(Math.max(0, goal.currentValue + increment), goal.targetValue);
  const isCompleted = newValue >= goal.targetValue;

  return {
    ...goal,
    currentValue: newValue,
    isCompleted,
    updatedAt: new Date().toISOString(),
  };
}

describe('Goal Logic', () => {
  const mockGoal: Goal = {
    id: '1',
    userId: 'user-1',
    title: 'Read 52 Books',
    description: 'Read 52 books in 2024',
    targetValue: 52,
    unit: 'books',
    period: 'yearly',
    category: 'personal',
    color: '#3b82f6',
    currentValue: 0,
    isCompleted: false,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  describe('Progress Calculation', () => {
    it('should calculate 0% progress when no books read', () => {
      const goal = { ...mockGoal, currentValue: 0 };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(0);
      expect(progress.isCompleted).toBe(false);
    });

    it('should calculate 50% progress', () => {
      const goal = { ...mockGoal, currentValue: 26 };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(50);
    });

    it('should calculate 100% progress', () => {
      const goal = { ...mockGoal, currentValue: 52, isCompleted: true };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(100);
      expect(progress.isCompleted).toBe(true);
    });

    it('should cap progress at 100% when over target', () => {
      const goal = { ...mockGoal, currentValue: 60 };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(100);
    });
  });

  describe('Progress Update', () => {
    it('should increment progress', () => {
      const goal = { ...mockGoal, currentValue: 10 };
      const updated = updateGoalProgress(goal, 5);
      expect(updated.currentValue).toBe(15);
    });

    it('should mark goal as completed when target reached', () => {
      const goal = { ...mockGoal, currentValue: 50 };
      const updated = updateGoalProgress(goal, 5);
      expect(updated.currentValue).toBe(52);
      expect(updated.isCompleted).toBe(true);
    });

    it('should not exceed target value', () => {
      const goal = { ...mockGoal, currentValue: 50 };
      const updated = updateGoalProgress(goal, 10);
      expect(updated.currentValue).toBe(52);
      expect(updated.isCompleted).toBe(true);
    });

    it('should not go below 0', () => {
      const goal = { ...mockGoal, currentValue: 2 };
      const updated = updateGoalProgress(goal, -10);
      expect(updated.currentValue).toBe(0);
    });
  });

  describe('Goal Period Queries', () => {
    it('should filter goals by daily period', () => {
      const goals = [
        mockGoal,
        { ...mockGoal, id: '2', period: 'daily' as const },
        { ...mockGoal, id: '3', period: 'weekly' as const },
      ];
      const dailyGoals = goals.filter(g => g.period === 'daily');
      expect(dailyGoals).toHaveLength(1);
      expect(dailyGoals[0].id).toBe('2');
    });

    it('should filter active goals by date range', () => {
      const now = new Date().toISOString().split('T')[0];
      const goals = [
        { ...mockGoal, id: '1', startDate: '2024-01-01', endDate: '2099-12-31' },
        { ...mockGoal, id: '2', startDate: '2099-01-01', endDate: '2099-12-31' },
      ];
      const activeGoals = goals.filter(g => g.startDate <= now && g.endDate >= now);
      expect(activeGoals).toHaveLength(1);
      expect(activeGoals[0].id).toBe('1');
    });
  });

  describe('Goal Categories', () => {
    it('should filter goals by category', () => {
      const goals = [
        { ...mockGoal, category: 'personal' },
        { ...mockGoal, id: '2', category: 'work' },
        { ...mockGoal, id: '3', category: 'health' },
      ];
      const personalGoals = goals.filter(g => g.category === 'personal');
      expect(personalGoals).toHaveLength(1);
    });

    it('should group goals by category', () => {
      const goals = [
        { ...mockGoal, category: 'personal' },
        { ...mockGoal, id: '2', category: 'work' },
        { ...mockGoal, id: '3', category: 'personal' },
      ];
      const grouped = goals.reduce((acc, g) => {
        if (!acc[g.category]) acc[g.category] = [];
        acc[g.category].push(g);
        return acc;
      }, {} as Record<string, Goal[]>);

      expect(grouped['personal']).toHaveLength(2);
      expect(grouped['work']).toHaveLength(1);
    });
  });

  describe('Goal Progress Bar Values', () => {
    it('should calculate correct percentage for 25% progress', () => {
      const goal = { ...mockGoal, targetValue: 100, currentValue: 25 };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(25);
    });

    it('should calculate correct percentage for 75% progress', () => {
      const goal = { ...mockGoal, targetValue: 100, currentValue: 75 };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(75);
    });

    it('should handle decimal progress values', () => {
      const goal = { ...mockGoal, targetValue: 3, currentValue: 1 };
      const progress = getGoalProgress(goal);
      expect(progress.percentage).toBe(33);
    });
  });
});
