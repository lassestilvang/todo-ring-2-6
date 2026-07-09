/**
 * ML Model Drift Detection System
 * Monitors prediction accuracy and triggers retraining when needed
 */

interface DriftMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  driftScore: number;
  timestamp: number;
}

interface ModelPrediction {
  taskId: string;
  predictedPriority: string;
  actualPriority: string;
  confidence: number;
}

export class MLDriftDetector {
  private metricsHistory: DriftMetrics[] = [];
  private driftThreshold = 0.15; // 15% accuracy drop triggers retraining
  private calibrationSamples = 100;

  /**
   * Monitor prediction accuracy over time
   */
  async monitorAccuracy(predictions: ModelPrediction[]): Promise<boolean> {
    if (predictions.length < this.calibrationSamples) {
      return false; // Not enough data yet
    }

    const accuracy = this.calculateAccuracy(predictions);
    const precision = this.calculatePrecision(predictions);
    const recall = this.calculateRecall(predictions);
    const driftScore = this.calculateDriftScore(accuracy);

    const metrics: DriftMetrics = {
      accuracy,
      precision,
      recall,
      driftScore,
      timestamp: Date.now(),
    };

    this.metricsHistory.push(metrics);
    this.maybeTriggerRetraining(metrics);

    return driftScore > this.driftThreshold;
  }

  /**
   * Calculate model accuracy
   */
  private calculateAccuracy(predictions: ModelPrediction[]): number {
    const correct = predictions.filter(p => p.predictedPriority === p.actualPriority).length;
    return correct / predictions.length;
  }

  /**
   * Calculate precision (positive predictive value)
   */
  private calculatePrecision(predictions: ModelPrediction[]): number {
    const truePositives = predictions.filter(
      p => p.predictedPriority === 'high' && p.actualPriority === 'high'
    ).length;
    const falsePositives = predictions.filter(
      p => p.predictedPriority === 'high' && p.actualPriority !== 'high'
    ).length;
    return truePositives / (truePositives + falsePositives || 1);
  }

  /**
   * Calculate recall (sensitivity)
   */
  private calculateRecall(predictions: ModelPrediction[]): number {
    const truePositives = predictions.filter(
      p => p.predictedPriority === 'high' && p.actualPriority === 'high'
    ).length;
    const falseNegatives = predictions.filter(
      p => p.predictedPriority !== 'high' && p.actualPriority === 'high'
    ).length;
    return truePositives / (truePositives + falseNegatives || 1);
  }

  /**
   * Calculate drift score based on historical accuracy
   */
  private calculateDriftScore(currentAccuracy: number): number {
    if (this.metricsHistory.length < 5) return 0;

    const recentAccuracies = this.metricsHistory
      .slice(-5)
      .map(m => m.accuracy);

    const historicalAverage = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;

    return Math.abs(currentAccuracy - historicalAverage);
  }

  /**
   * Determine if retraining should be triggered
   */
  private maybeTriggerRetraining(metrics: DriftMetrics): void {
    if (metrics.driftScore > this.driftThreshold) {
      this.triggerRetraining(metrics);
    }
  }

  /**
   * Trigger model retraining
   */
  private triggerRetraining(metrics: DriftMetrics): void {
    console.log(`🚨 Model drift detected (${(metrics.driftScore * 100).toFixed(1)}% drop in accuracy)`);

    // In production, this would:
    // 1. Queue a retraining job
    // 2. Alert system administrators
    // 3. Temporarily disable predictions until retraining completes
    // 4. Log the event for tracking

    // For now, we'll just log it
    console.log(`Scheduling immediate model retraining...`);
  }

  /**
   * Get current drift metrics
   */
  getCurrentMetrics(): DriftMetrics | null {
    return this.metricsHistory[this.metricsHistory.length - 1] || null;
  }

  /**
   * Get drift history for the last N days
   */
  getDriftHistory(days: number): DriftMetrics[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  /**
   * Reset metrics history
   */
  resetMetrics(): void {
    this.metricsHistory = [];
  }
}

// Singleton instance
export const mlDriftDetector = new MLDriftDetector();