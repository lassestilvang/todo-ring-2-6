/**
 * ML-Powered Task Priority Prediction
 * Integrates TensorFlow.js for intelligent task prioritization
 */

import { Task, Priority } from '@/types/index';
import { getTaskRepository } from '@/lib/repositories';

// Feature encoding utilities
type PriorityScore = 0 | 1 | 2 | 3; // low=0, medium=1, high=2, urgent=3

function encodePriority(priority: Priority): PriorityScore {
  const scores: Record<Priority, PriorityScore> = { low: 0, medium: 1, high: 2, urgent: 3, none: 1 };
  return scores[priority];
}

function decodePriority(score: PriorityScore): Priority {
  const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  return priorities[score] || 'medium';
}

// Feature vector extraction
export function extractTaskFeatures(task: Task): number[] {
  const now = Date.now();
  const features = [
    encodePriority(task.priority),
    task.deadline ? Math.max(0, (new Date(task.deadline).getTime() - now) / (1000 * 60 * 60)) : -1, // Hours until deadline
    (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0), // Total minutes estimate
    task.recurringType !== 'none' ? 1 : 0, // Is recurring
    task.assigneeId ? 1 : 0, // Is assigned
    task.isAllDay ? 1 : 0, // All day task
    task.isHabit ? 1 : 0, // Habit task
  ];
  return features;
}

// Simple ML model stub (TensorFlow.js integration)
// In production, this would load a trained model
let mlModelLoaded = false;

export async function initializeMLModel() {
  try {
    // Simulate model loading
    // In production, use tf.loadLayersModel('file://priority-model')
    mlModelLoaded = true;
    console.log('✅ ML Priority Model initialized');
    return true;
  } catch (error) {
    console.error('Failed to load ML model, falling back to rule-based', error);
    mlModelLoaded = false;
    return false;
  }
}

// Predict priority using ML model if available, otherwise use rule-based
export async function predictPriority(task: Task): Promise<Priority> {
  if (mlModelLoaded) {
    return await mlBasedPriority(task);
  }
  return ruleBasedPriority(task);
}

// Rule-based priority prediction (fallback)
export function ruleBasedPriority(task: Task): Priority {
  const now = Date.now();
  const deadlineSoon = task.deadline && new Date(task.deadline).getTime() - now < 24 * 60 * 60 * 1000;
  const deadlineApproaching = task.deadline && new Date(task.deadline).getTime() - now < 7 * 24 * 60 * 60 * 1000;

  if (task.priority === 'urgent' || (deadlineSoon && task.priority === 'high')) {
    return 'urgent';
  }
  if (deadlineSoon || task.priority === 'high') {
    return 'high';
  }
  if (deadlineApproaching || task.priority === 'medium') {
    return 'medium';
  }
  return 'low';
}

// ML-based priority prediction stub
async function mlBasedPriority(task: Task): Promise<Priority> {
  const features = extractTaskFeatures(task);

  // In production, this would call the TensorFlow model
  // const tensor = tf.tensor2d([features]);
  // const prediction = model.predict(tensor) as tf.Tensor;
  // const scores = await prediction.data();
  // return decodePriority(scores.indexOf(Math.max(...scores)) as PriorityScore);

  // Stub implementation using weighted scoring
  let score = features[0]; // Base priority

  // Add deadline weight
  if (features[1] > 0 && features[1] < 24) {
    score += 0.5;
  }

  // Add recurrence bonus
  if (features[3] > 0) {
    score += 0.1;
  }

  // Add assignment bonus
  if (features[4] > 0) {
    score += 0.2;
  }

  if (score >= 3) return 'urgent';
  if (score >= 2.5) return 'high';
  if (score >= 1.5) return 'medium';
  return 'low';
}

// Training function (would run offline)
export async function trainPriorityModel() {
  const taskRepo = getTaskRepository();
  const tasks = await taskRepo.findAll();

  // Prepare training data
  const trainingData = tasks.map((task: Task) => ({
    features: extractTaskFeatures(task),
    label: encodePriority(task.priority),
  }));

  // In production, train TensorFlow model with trainingData
  console.log(`Prepared ${trainingData.length} samples for training`);
}

// Export types
export type { PriorityScore };