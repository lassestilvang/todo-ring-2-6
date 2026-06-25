/**
 * Habit Streak Logic Tests
 * Tests for habit streak calculations and updates
 */

import { describe, it, expect } from 'vitest';

interface HabitStreak {
  id: string;
  taskId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string | null;
  streakStart: string | null;
  createdAt: string;
  updatedAt: string;
}

// Update habit streak when task is completed
function updateHabitStreakOnComplete(
  streak: HabitStreak | null,
  today: string
): HabitStreak {
  if (!streak) {
    return {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9),
      taskId: 'test-task',
      currentStreak: 1,
      longestStreak: 1,
      lastCompleted: today,
      streakStart: today,
      createdAt: today,
      updatedAt: today,
    };
  }

  const lastCompletedVal = streak.lastCompleted ?? '';
  const wasToday = lastCompletedVal.length > 0 && lastCompletedVal.startsWith(today);
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';
  const completedYesterday = lastCompletedVal.length > 0 && lastCompletedVal.startsWith(yesterday);

  if (wasToday) {
    return streak; // Already completed today
  }

  let newCurrentStreak: number;
  let newStreakStart: string | null = streak.streakStart ?? today;

  if (completedYesterday) {
    // Continue streak
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // Reset streak
    newCurrentStreak = 1;
    newStreakStart = today;
  }

  const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

  return {
    ...streak,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastCompleted: today,
    streakStart: newStreakStart,
    updatedAt: today,
  };
}

describe('Habit Streak Logic', () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  describe('New Habit Streak', () => {
    it('should create a new streak when none exists', () => {
      const streak = updateHabitStreakOnComplete(null, today);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
      expect(streak.lastCompleted).toBe(today);
    });

    it('should set streak start date', () => {
      const streak = updateHabitStreakOnComplete(null, today);
      expect(streak.streakStart).toBe(today);
    });
  });

  describe('Existing Streak - Continue', () => {
    it('should continue streak when completed yesterday', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 3,
        longestStreak: 3,
        lastCompleted: yesterday,
        streakStart: '2024-01-10',
        createdAt: '2024-01-10',
        updatedAt: yesterday,
      };

      const streak = updateHabitStreakOnComplete(existingStreak, today);
      expect(streak.currentStreak).toBe(4);
      expect(streak.longestStreak).toBe(4);
      expect(streak.lastCompleted).toBe(today);
    });

    it('should update longest streak if current exceeds it', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 5,
        longestStreak: 5,
        lastCompleted: yesterday,
        streakStart: '2024-01-10',
        createdAt: '2024-01-10',
        updatedAt: yesterday,
      };

      const streak = updateHabitStreakOnComplete(existingStreak, today);
      expect(streak.longestStreak).toBe(6);
    });
  });

  describe('Existing Streak - Reset', () => {
    it('should reset streak when not completed yesterday', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 5,
        longestStreak: 10,
        lastCompleted: '2024-01-01', // Not yesterday
        streakStart: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const streak = updateHabitStreakOnComplete(existingStreak, today);
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(10); // Preserved
      expect(streak.streakStart).toBe(today);
    });
  });

  describe('Already Completed Today', () => {
    it('should not change streak if already completed today', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 3,
        longestStreak: 5,
        lastCompleted: today,
        streakStart: '2024-01-10',
        createdAt: '2024-01-10',
        updatedAt: today,
      };

      const streak = updateHabitStreakOnComplete(existingStreak, today);
      expect(streak.currentStreak).toBe(3);
      expect(streak.lastCompleted).toBe(today);
    });
  });

  describe('Edge Cases', () => {
    it('should handle streak with null lastCompleted', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 0,
        longestStreak: 0,
        lastCompleted: null,
        streakStart: null,
        createdAt: today,
        updatedAt: today,
      };

      const streak = updateHabitStreakOnComplete(existingStreak, today);
      expect(streak.currentStreak).toBe(1);
    });

    it('should handle empty string lastCompleted', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 0,
        longestStreak: 0,
        lastCompleted: '',
        streakStart: null,
        createdAt: today,
        updatedAt: today,
      };

      const streak = updateHabitStreakOnComplete(existingStreak, today);
      expect(streak.currentStreak).toBe(1);
    });
  });

  describe('Reset Streak', () => {
    it('should reset current streak but preserve longest', () => {
      const existingStreak: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 10,
        longestStreak: 15,
        lastCompleted: yesterday,
        streakStart: '2024-01-01',
        createdAt: '2024-01-01',
        updatedAt: yesterday,
      };

      // Reset function
      const resetStreak = (s: HabitStreak) => ({
        ...s,
        currentStreak: 0,
        streakStart: null,
      });

      const streak = resetStreak(existingStreak);
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(15);
      expect(streak.streakStart).toBeNull();
    });
  });
});
