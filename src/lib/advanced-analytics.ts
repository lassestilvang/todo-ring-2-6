/**
 * Advanced Analytics Engine for Task Optimization
 * Implements predictive modeling, anomaly detection, and recommendations
 */

import { Task } from '@/types/index';
import { getTaskRepository } from '@/lib/repositories';
import { z } from 'zod';

// Schema for anomaly detection
const AnomalySchema = z.object({
  taskId: z.string(),
  deviation: z.number(),
  severity: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
  confidence: z.number(),
});

type Anomaly = z.infer<typeof AnomalySchema>;

export class AdvancedAnalytics {
  private taskRepository = getTaskRepository();
  private anomalyThreshold = 2.0; // standard deviations

  /**
   * Detect anomalies in task patterns
   */
  async detectAnomalies(): Promise<Anomaly[]> {
    const tasks = await this.taskRepository.findAll();
    const historicalData: Record<string, number[]> = {};

    // Build historical vectors for each task
    tasks.forEach((task) => {
      const key = `${task.id}:${task.priority}:${task.status}`;
      if (!historicalData[key]) {
        historicalData[key] = [];
      }
      historicalData[key].push(task.estimateHours || 0);
    });

    // Calculate anomalies
    const anomalies: Anomaly[] = [];
    for (const [key, values] of Object.entries(historicalData)) {
      if (values.length < 3) continue; // Need enough data points

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => Math.pow(a - mean, 2) + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const currentValue = values[values.length - 1];
      const deviation = Math.abs(currentValue - mean) / stdDev;

      if (deviation > this.anomalyThreshold) {
        anomalies.push({
          taskId: key.split(':')[0],
          deviation,
          severity: deviation > 3 ? 'high' : 'medium',
          reason: `Deviation of ${deviation.toFixed(2)}σ from historical average`,
          confidence: 1 - deviation / 5, // Normalized confidence
        });
      }
    }

    return anomalies;
  }

  /**
   * Predict task completion probability
   * Uses simple Bayesian approach based on historical completion rates
   */
  async predictCompletionProbability(taskId: string): Promise<number> {
    const tasks = await this.taskRepository.findAll();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return 0;

    // Calculate completion rate for similar tasks
    const similarTasks = tasks.filter(
      (t) => t.priority === task.priority && t.status === 'completed'
    );
    const completionRate = similarTasks.length / tasks.length;

    // Add task-specific factors
    const urgencyFactor = task.deadline ? this.calculateUrgencyFactor(task) : 0.5;
    const complexityFactor = this.calculateComplexityFactor(task);
    const motivationFactor = this.calculateMotivationFactor(task);

    return Math.min(1, completionRate * urgencyFactor * (1 - complexityFactor) * motivationFactor);
  }

  private calculateUrgencyFactor(task: Task): number {
    const now = Date.now();
    const deadline = new Date(task.deadline!).getTime();
    const hoursUntilDeadline = (deadline - now) / (1000 * 60 * 60);
    if (hoursUntilDeadline < 24) return 1.5;
    if (hoursUntilDeadline < 72) return 1.2;
    return 1;
  }

  private calculateComplexityFactor(task: Task): number {
    const estimateHours = task.estimateHours || 0;
    if (estimateHours > 40) return 0.7;
    if (estimateHours > 20) return 0.8;
    return 1;
  }

  private calculateMotivationFactor(task: Task): number {
    // In a real system, this would query user motivation data
    return 1;
  }

  /**
   * Generate task optimization recommendations
   */
  async generateRecommendations(): Promise<any[]> {
    // Get anomalies
    const anomalies = await this.detectAnomalies();

    // Get completion probabilities
    const predictions = await Promise.all(
      anomalies.map((anom) => this.predictCompletionProbability(anom.taskId))
    );

    return anomalies.map((anom, i) => ({
      taskId: anom.taskId,
      anomaly: anom,
      prediction: predictions[i],
      recommendation: this.generateRecommendation(anom),
    }));
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(anomaly: Anomaly): string {
    switch (anomaly.severity) {
      case 'high':
        return '⚠️ High deviation detected - consider re-estimating effort';
      case 'medium':
        return '🔍 Medium deviation - review task details';
      default:
        return '✅ Normal pattern detected';
    }
  }

  /**
   * Calculate workload balance across team
   */
  async calculateWorkloadBalance(): Promise<number> {
    const tasks = await this.taskRepository.findAll();
    const memberWorkloads: Record<string, number> = {};

    tasks.forEach((task) => {
      const assigneeId = task.assigneeId as string;
      if (!assigneeId) return;

      const estimate = task.estimateHours || 0;
      memberWorkloads[assigneeId] = (memberWorkloads[assigneeId] || 0) + estimate;
    });

    const values = Object.values(memberWorkloads);
    if (values.length === 0) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const deviations = values.map(v => Math.abs(v - mean));
    const giniCoefficient = deviations.reduce((sum, dev) => sum + dev, 0) / (mean * values.length);

    return giniCoefficient * 100; // Scale to percentage
  }
}