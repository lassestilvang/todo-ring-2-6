/**
 * Task Scheduling Assistant
 * AI-powered optimal time slot suggestions based on calendar, habits, and focus sessions
 */

import { getFocusSessionRepository } from './repositories/focus-session-repository';
import { getHabitStreakRepository } from './repositories/habit-streak-repository';
import type { Task, HabitStreak } from '../types';

export interface TimeSlot {
  start: Date;
  end: Date;
  score: number;
  reason: string;
}

export interface ScheduleSuggestion {
  taskId: string;
  suggestedTime: TimeSlot;
  confidence: 'high' | 'medium' | 'low';
  alternatives: TimeSlot[];
}

/**
 * Calculate optimal time slots for a task
 */
export class SchedulingAssistant {
  constructor(private userId: string) {}

  /**
   * Get optimal time slots for a task
   * Considers calendar availability, habits, focus sessions, and task requirements
   */
  async suggestSchedule(task: Partial<Task>): Promise<ScheduleSuggestion[]> {
    const now = new Date();
    const suggestions: ScheduleSuggestion[] = [];

    // Get user's focus sessions and habits
    const [focusSessions, habitStreaks] = await Promise.all([
      this.getRecentFocusSessions(),
      this.getHabitStreaks()
    ]);

    // Get blocked time ranges
    const blockedRanges = this.getBlockedRanges(focusSessions, habitStreaks);

    // Calculate available time slots for the next 7 days
    const availableSlots = this.findAvailableSlots(blockedRanges, 7);

    // Score each slot based on task requirements
    for (const slot of availableSlots) {
      const score = this.scoreSlot(slot, task, habitStreaks);
      if (score > 0.3) {
        suggestions.push({
          taskId: task.id || 'new',
          suggestedTime: { ...slot, score },
          confidence: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low',
          alternatives: []
        });
      }
    }

    // Sort by score and add alternatives
    return suggestions
      .sort((a, b) => b.suggestedTime.score - a.suggestedTime.score)
      .slice(0, 3)
      .map((suggestion, index, array) => ({
        ...suggestion,
        alternatives: array
          .filter((_, i) => i !== index)
          .map(s => s.suggestedTime)
      }));
  }

  /**
   * Get user's recent focus sessions
   */
  private async getRecentFocusSessions(): Promise<{ duration: number; startedAt: string }[]> {
    const repo = getFocusSessionRepository();
    return repo.findAll(this.userId, 10).map(s => ({
      duration: s.duration,
      startedAt: s.startedAt
    }));
  }

  /**
   * Get user's habit streaks
   */
  private async getHabitStreaks(): Promise<HabitStreak[]> {
    const repo = getHabitStreakRepository();
    return repo.findAll();
  }

  /**
   * Get blocked time ranges from focus sessions and habits
   */
  private getBlockedRanges(
    focusSessions: { duration: number; startedAt: string }[],
    habitStreaks: HabitStreak[]
  ): TimeSlot[] {
    const blocked: TimeSlot[] = [];

    // Add focus session blocks
    for (const session of focusSessions) {
      const start = new Date(session.startedAt);
      blocked.push({
        start,
        end: new Date(start.getTime() + session.duration * 60000),
        score: 0.8,
        reason: 'Focus session'
      });
    }

    // Add habit time blocks (if habits have preferred times)
    for (const habit of habitStreaks) {
      // Assume habits are typically done in the morning
      const morning = new Date();
      morning.setHours(8, 0, 0, 0);
      blocked.push({
        start: morning,
        end: new Date(morning.getTime() + 60 * 60 * 1000),
        score: 0.6,
        reason: 'Habit time'
      });
    }

    return blocked;
  }

  /**
   * Find available time slots in the next N days
   */
  private findAvailableSlots(blockedRanges: TimeSlot[], days: number): TimeSlot[] {
    const available: TimeSlot[] = [];
    const now = new Date();
    const endRange = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Default working hours: 9 AM - 5 PM
    const workDayStart = 9;
    const workDayEnd = 17;

    for (let d = new Date(now); d < endRange; d.setDate(d.getDate() + 1)) {
      // Skip weekends
      if (d.getDay() === 0 || d.getDay() === 6) continue;

      // Check each hour
      for (let hour = workDayStart; hour < workDayEnd; hour++) {
        const slotStart = new Date(d);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        // Check if slot is blocked
        const isBlocked = blockedRanges.some(block =>
          slotStart < block.end && slotEnd > block.start
        );

        if (!isBlocked) {
          available.push({
            start: slotStart,
            end: slotEnd,
            score: 0.5, // Base score
            reason: 'Available'
          });
        }
      }
    }

    return available;
  }

  /**
   * Score a time slot based on task requirements
   */
  private scoreSlot(slot: TimeSlot, task: Partial<Task>, habitStreaks: HabitStreak[]): number {
    let score = slot.score;

    // Prefer morning slots for high-priority tasks
    if (task.priority === 'high') {
      const hour = slot.start.getHours();
      if (hour >= 9 && hour <= 11) {
        score += 0.3;
      }
    }

    // Prefer slots that align with habit streaks (don't break routines)
    const isHabitTime = habitStreaks.some(h => h.currentStreak > 0);
    if (isHabitTime && slot.start.getHours() >= 8 && slot.start.getHours() <= 10) {
      score += 0.2;
    }

    // Avoid late afternoon for complex tasks
    if (task.estimateHours && task.estimateHours > 2 && slot.start.getHours() >= 15) {
      score -= 0.3;
    }

    // Prefer slots with less interruption (avoid meeting-heavy times)
    const hour = slot.start.getHours();
    if (hour >= 14 && hour <= 16) {
      score -= 0.1; // Lunch/meeting time
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get recommended focus duration for a task
   */
  static getRecommendedDuration(task: Partial<Task>): number {
    const totalMinutes = (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);

    if (totalMinutes === 0) {
      return 25; // Default Pomodoro
    }

    // Round up to nearest 15 minutes, max 2 hours
    return Math.min(120, Math.ceil(totalMinutes / 15) * 15);
  }
}

/**
 * Generate schedule suggestions for multiple tasks
 */
export async function generateScheduleSuggestions(
  userId: string,
  tasks: Partial<Task>[]
): Promise<ScheduleSuggestion[]> {
  const assistant = new SchedulingAssistant(userId);
  const allSuggestions: ScheduleSuggestion[] = [];

  for (const task of tasks) {
    const suggestions = await assistant.suggestSchedule(task);
    allSuggestions.push(...suggestions);
  }

  return allSuggestions.sort((a, b) => b.suggestedTime.score - a.suggestedTime.score);
}