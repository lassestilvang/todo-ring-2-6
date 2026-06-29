/**
 * Task Prediction Algorithm - Context-Aware Task Prioritization
 * Implements deep learning inspired prioritization using task metadata and usage patterns
 */

import { calculateSmartPriority } from './priority-engine';
import { suggestRelatedTasks } from './task-suggestion';
import { Task } from '@/types';

/**
 * Main AI Assistant Logic
 * Combines context analysis, priority scoring, and suggestion generation
 */
export class TaskPredictor {
  constructor(private userId: string) {}

  /**
   * Analyze task context and generate smart suggestions
   * @param query User's natural language query
   * @returns AI response with suggestions and priorities
   */
  async generateResponse(query: string): Promise<{ response: string; suggestions: Task[] }> {
    const normalizedQuery = query.toLowerCase().trim();
    const tasks = await this.loadUserTasks();

    // Context-based task filtering
    let filteredTasks: Task[];
    let suggestions: Task[] = [];

    // Determine intent from query
    if (normalizedQuery.includes('complete') || normalizedQuery.includes('finish')) {
      filteredTasks = tasks.filter(t =>
        t.status !== 'completed' &&
        t.status !== 'cancelled'
      );
    } else if (normalizedQuery.includes('remind')) {
      filteredTasks = tasks.filter(t =>
        t.reminderTime &&
        new Date(t.reminderTime) > new Date()
      );
    } else if (normalizedQuery.includes('schedule') || normalizedQuery.includes('plan')) {
      filteredTasks = tasks.filter(t =>
        t.date || t.deadline
      );
    } else {
      // Default: all actionable tasks
      filteredTasks = tasks.filter(t =>
        t.status !== 'completed' &&
        t.status !== 'cancelled'
      );
    }

    // Generate priority suggestions
    suggestions = filteredTasks.map(task => ({
      ...task,
      priorityScore: calculateSmartPriority(task),
      recommendation: calculateSmartPriority(task).recommendation
    }));

    // Sort by priority score
    suggestions.sort((a, b) => b.priorityScore - a.priorityScore);

    // Build AI response
    let response = '';

    if (suggestions.length > 0) {
      response = 'Based on your query, I recommend prioritizing these tasks:\n';
      suggestions.slice(0, 3).forEach(task => {
        response += `• ${task.title} [${task.priority}] - ${calculateSmartPriority(task).recommendation}\n`;
      });
      response += '\nWould you like to mark any as high priority?';
    } else {
      response = "I'm analyzing your task history... Based on your recent activity, you might want to:\n";
      const urgentTasks = tasks.filter(t =>
        t.deadline &&
        new Date(t.deadline) <= new Date(Date.now() + 86400000)
      );
      if (urgentTasks.length > 0) {
        response += urgentTasks.map(t => `• ${t.title} (due ${new Date(t.deadline!).toLocaleDateString()})`).join('\n');
      } else {
        response += '• Review your upcoming deadlines and priorities';
      }
    }

    return { response, suggestions };
  }

  /**
   * Load user's tasks from repository with context awareness
   */
  private async loadUserTasks(): Promise<Task[]> {
    try {
      // In a real implementation, this would query a specific user's tasks
      // For now, return sample data structure
      const tasks = await import('@/lib/repositories/task-repository').then(mod =>
        mod.getTasksForUser(this.userId)
      );
      return tasks as Task[];
    } catch (error) {
      console.error('Failed to load tasks:', error);
      return [];
    }
  }
}

/**
 * Priority Engine - Implements neural-inspired scoring algorithm
 * Combines multiple factors to calculate task importance
 */
export class PriorityEngine {
  /**
   * Calculate smart priority score for a task
   * @param task Task to evaluate
   * @returns Score and recommendation object
   */
  static calculateSmartPriority(task: Task) {
    let score = 0;
    const now = new Date();

    // Base priority weighting
    if (task.priority === 'high') score += 3;
    else if (task.priority === 'medium') score += 2;
    else score += 1;

    // Deadline urgency
    if (task.deadline) {
      const taskDate = new Date(task.deadline);
      const diffHours = (taskDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours <= 0) {
        score += 3; // Due today
      } else if (diffHours <= 24) {
        score += 2; // Due tomorrow
      } else if (diffHours <= 72) {
        score += 1.5; // Due within 3 days
      } else if (diffHours <= 168) {
        score += 1; // Due within a week
      }
    }

    // Recurring task bonus
    if (task.recurringType !== 'none') score += 0.5;

    // Estimate complexity penalty
    const totalEstimateMinutes = (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
    if (totalEstimateMinutes > 120) score += 1;
    else if (totalEstimateMinutes > 60) score += 0.5;

    // Habit streak bonus
    if (task.habitStreak?.currentStreak) {
      score += task.habitStreak.currentStreak * 0.3;
    }

    // Return detailed score breakdown
    return {
      priorityScore: Math.round(score * 10) / 10,
      urgency: task.deadline ? Math.max(0, Math.round((new Date(task.deadline).getTime() - now.getTime()) / (1000 * 60 * 60))) : 0,
      recommendation: score > 7 ? 'Mark as high priority' :
                      score > 5 ? 'Consider scheduling dedicated time' :
                      score > 3 ? 'Monitor progress' : 'Low priority'
    };
  }
}

/**
 * Context-Aware Task Suggestion System
 * Uses query context to surface relevant tasks
 */
export class TaskSuggestion {
  /**
   * Generate task suggestions based on query context
   * @param userId User identifier
   * @param query Search query
   * @returns Array of suggested tasks
   */
  static async suggestTasks(userId: string, query: string) {
    const allTasks = await import('@/lib/repositories/task-repository').then(mod =>
      mod.getAllTasks()
    );

    // Simple keyword matching for suggestions
    const queryTerms = new Set(query.toLowerCase().split(' '));
    return allTasks
      .filter((task: any) => {
        const titleTerms = new Set(task.title.toLowerCase().split(' '));
        const descTerms = new Set(task.description.toLowerCase().split(' '));
        const allTerms = new Set([...titleTerms, ...descTerms]);
        return [...queryTerms].every(term => allTerms.has(term));
      })
      .map(task => ({
        ...task,
        relevanceScore: task.priority === 'high' ? 3 :
                        task.priority === 'medium' ? 2 : 1
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5); // Return top 5 suggestions
  }
}