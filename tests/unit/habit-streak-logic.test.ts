/**
 * Habit Streak Logic Tests
 *
 * Tests the habit streak calculation logic independently.
 */

import { describe, it, expect, beforeEach } from 'vitest';

interface HabitStreak {
  id: string;
  taskId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string | null;
  streakStart: string | null;
}

// Replicate the streak update logic
function updateHabitStreakOnComplete(
  streak: HabitStreak | null,
  today: string
): HabitStreak {
  if (!streak) {
    return {
      id: 'new-id',
      taskId: 'task-1',
      currentStreak: 1,
      longestStreak: 1,
      lastCompleted: today,
      streakStart: today,
    };
  }

  const wasToday = streak.lastCompleted?.startsWith(today) ?? false;
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';
  const completedYesterday = streak.lastCompleted?.startsWith(yesterday) ?? false;

  if (wasToday) {
    return streak;
  }

  let newCurrentStreak: number;
  let newStreakStart: string | null = streak.streakStart ?? today;

  if (completedYesterday) {
    newCurrentStreak = streak.currentStreak + 1;
  } else {
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
  };
}

describe('Habit Streak Logic', () => {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  describe('updateHabitStreakOnComplete', () => {
    it('should create new streak when none exists', () => {
      const result = updateHabitStreakOnComplete(null, today);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.lastCompleted).toBe(today);
    });

    it('should continue streak when completed yesterday', () => {
      const existing: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 3,
        longestStreak: 3,
        lastCompleted: yesterday,
        streakStart: '2024-01-10',
      };

      const result = updateHabitStreakOnComplete(existing, today);
      expect(result.currentStreak).toBe(4);
      expect(result.longestStreak).toBe(4);
    });

    it('should reset streak when not completed yesterday', () => {
      const existing: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 3,
        longestStreak: 5,
        lastCompleted: '2024-01-01', // More than a day ago
        streakStart: '2024-01-01',
      };

      const result = updateHabitStreakOnComplete(existing, today);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(5); // Keep longest
      expect(result.streakStart).toBe(today);
    });

    it('should not change streak if already completed today', () => {
      const existing: HabitStreak = {
        id: '1',
        taskId: 'task-1',
        currentStreak: 3,
        longestStreak: 5,
        lastCompleted: today,
        streakStart: '2024-01-01',
      };

      const result = updateHabitStreakOnComplete(existing, today);
      expect(result.currentStreak).toBe(3);
      expect(result.lastCompleted).toBe(today);
    });
  });
});