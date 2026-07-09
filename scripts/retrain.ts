import { retrainPriorityModel } from '@/lib/ai/task-ml';
import { initializeTaskAI } from '@/lib/ai/task-predictor';
import { mlDriftDetector } from '@/lib/ml-drift-detection';
import { getTaskRepository } from '@/lib/repositories';
import { Task } from '@/types/index';
import { extractTaskFeatures } from '@/lib/ai/task-ml';

async function main() {
  try {
    await initializeTaskAI();
    console.log('🔄 Starting model retraining job');

    // Load recent tasks to evaluate current model performance
    const taskRepo = getTaskRepository();
    const tasks = await taskRepo.findAll<Task>();

    // Prepare feature vectors and actual priorities
    const predictions = tasks.map(task => {
      const features = extractTaskFeatures(task);
      // In real scenario, we would use the ML model to predict.
      // For drift detection demo, we'll use a dummy prediction (e.g., always 'medium')
      // In production, replace with actual model.predict(features)
      const predicted = 'medium'; // placeholder
      return {
        taskId: task.id,
        predictedPriority: predicted,
        actualPriority: task.priority,
        confidence: 0.8, // placeholder confidence
      };
    });

    // Run drift detection
    const driftDetected = await mlDriftDetector.monitorAccuracy(predictions);
    if (driftDetected) {
      console.log('⚠️ Model drift detected – proceeding with retraining');
    } else {
      console.log('✅ No significant drift detected – skipping retraining');
      // Optionally still retrain if you want periodic updates regardless
      // For now, we'll still retrain to keep model fresh
      console.log('🔄 Proceeding with scheduled retraining anyway');
    }

    // Retrain the model
    await retrainPriorityModel();

    console.log('✅ Model retraining completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Retraining failed:', error);
    process.exit(1);
  }
}

main();