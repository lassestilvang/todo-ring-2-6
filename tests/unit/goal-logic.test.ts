/**
 * Goal Progress Logic Tests
 *
 * Tests the goal progress calculation logic independently.
 */

import { describe, it, expect } from 'vitest';

interface Goal {
  id: string;
  currentValue: number;
  targetValue: number;
  isCompleted: number;
}

// Replicate the goal progress logic
function getGoalProgress(goal: Goal): {
  current: number;
  target: number;
  percentage: number;
  isCompleted: boolean;
} {
  const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  return {
    current: goal.currentValue,
    target: goal.targetValue,
    percentage,
    isCompleted: Boolean(goal.isCompleted),
  };
}

function updateGoalProgress(currentValue: number, targetValue: number, increment: number): {
  newValue: number;
  isCompleted: boolean;
} {
  const newValue = Math.min(Math.max(currentValue + increment, 0), targetValue);
  const isCompleted = newValue >= targetValue;
  return { newValue, isCompleted };
}

describe('Goal Progress Logic', () => {
  describe('getGoalProgress', () => {
    it('should calculate 0% progress when currentValue is 0', () => {
      const goal: Goal = { id: '1', currentValue: 0, targetValue: 100, isCompleted: 0 };
      const result = getGoalProgress(goal);
      expect(result.percentage).toBe(0);
    });

    it('should calculate 50% progress correctly', () => {
      const goal: Goal = { id: '1', currentValue: 50, targetValue: 100, isCompleted: 0 };
      const result = getGoalProgress(goal);
      expect(result.percentage).toBe(50);
    });

    it('should calculate 100% progress correctly', () => {
      const goal: Goal = { id: '1', currentValue: 100, targetValue: 100, isCompleted: 0 };
      const result = getGoalProgress(goal);
      expect(result.percentage).toBe(100);
    });

    it('should cap percentage at 100 when exceeding target', () => {
      const goal: Goal = { id: '1', currentValue: 150, targetValue: 100, isCompleted: 0 };
      const result = getGoalProgress(goal);
      expect(result.percentage).toBe(100);
    });

    it('should return isCompleted as true when completed', () => {
      const goal: Goal = { id: '1', currentValue: 100, targetValue: 100, isCompleted: 1 };
      const result = getGoalProgress(goal);
      expect(result.isCompleted).toBe(true);
    });

    it('should return isCompleted as false when not completed', () => {
      const goal: Goal = { id: '1', currentValue: 50, targetValue: 100, isCompleted: 0 };
      const result = getGoalProgress(goal);
      expect(result.isCompleted).toBe(false);
    });
  });

  describe('updateGoalProgress', () => {
    it('should increment progress', () => {
      const result = updateGoalProgress(50, 100, 10);
      expect(result.newValue).toBe(60);
      expect(result.isCompleted).toBe(false);
    });

    it('should mark as completed when reaching target', () => {
      const result = updateGoalProgress(90, 100, 10);
      expect(result.newValue).toBe(100);
      expect(result.isCompleted).toBe(true);
    });

    it('should not exceed target', () => {
      const result = updateGoalProgress(95, 100, 10);
      expect(result.newValue).toBe(100);
      expect(result.isCompleted).toBe(true);
    });

    it('should not go below 0', () => {
      const result = updateGoalProgress(5, 100, -10);
      expect(result.newValue).toBe(0);
    });
  });
});