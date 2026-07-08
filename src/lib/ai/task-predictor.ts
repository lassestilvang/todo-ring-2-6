/**
 * Task Prediction Algorithm - Context-Aware Task Prioritization
 * Implements deep learning inspired prioritization using task metadata and usage patterns
 */

import { Priority } from '@/types/index';
import { analyzeTaskSignature } from './analysis';
import { predictPriority as mlPredictPriority, initializeMLModel } from './task-ml';
import type { Task } from '@/types';

/**
 * Initialize AI models (call on app startup)
 */
export async function initializeTaskAI() {
  await initializeMLModel();
  console.log('✅ Task AI predictor initialized');
}

/**
 * Context-aware priority prediction
 * Uses ML model when available, falls back to rule-based
 */
export async function predictTaskPriority(task: Task): Promise<Priority> {
  // Try ML-based prediction first
  try {
    return await mlPredictPriority(task);
  } catch (error) {
    console.warn('ML prediction failed, using fallback', error);
    return fallbackPriority(task);
  }
}

/**
 * Fallback priority prediction using basic rules
 */
function fallbackPriority(task: Task): Priority {
  const now = Date.now();
  const deadline = task.deadline ? new Date(task.deadline) : null;

  if (task.priority === 'urgent') return 'urgent';
  if (deadline && deadline.getTime() - now < 24 * 60 * 60 * 1000) return 'high';
  if (deadline && deadline.getTime() - now < 7 * 24 * 60 * 60 * 1000) return 'medium';
  return task.priority || 'low';
}

// Re-export for backward compatibility
export { Priority };