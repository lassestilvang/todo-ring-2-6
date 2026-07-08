#!/usr/bin/env node
/**
 * Automated ML Model Retraining Script
 * Scheduled task to retrain task priority prediction model
 */

import { trainPriorityModel } from '@/lib/ai/task-ml';
import { initializeTaskAI } from '@/lib/ai/task-predictor';

async function main() {
  try {
    console.log('🚀 Starting ML model retraining job');

    // Initialize AI components
    await initializeTaskAI();

    // Retrain the model
    const result = await trainPriorityModel();

    console.log('✅ Model retraining completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Model retraining failed:', error);
    process.exit(1);
  }
}

main();