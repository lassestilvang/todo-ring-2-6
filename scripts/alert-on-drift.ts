/**
 * Drift Alert Notification Script
 * Sends alerts when ML model drift is detected
 */

import { mlDriftDetector } from '@/lib/ml-drift-detection';
import { getNotificationService } from '@/lib/notification-service';
import type { NotificationSettings } from '@/types/index';

async function sendDriftAlert(adminEmail: string, driftScore: number) {
  const service = getNotificationService();

  await service.sendEmail({
    to: adminEmail,
    subject: '⚠️ ML Model Drift Detected',
    html: `
      <h2>ML Model Drift Alert</h2>
      <p>A significant drift has been detected in the task priority prediction model:</p>
      <ul>
        <li>Drift Score: ${(driftScore * 100).toFixed(2)}%</li>
        <li>Action: Model retraining has been automatically triggered</li>
      </ul>
      <p>Please review the model performance in the admin dashboard.</p>
    `,
  });

  console.log(`Drift alert sent to ${adminEmail}`);
}

async function main() {
  try {
    // In production, this would be triggered by the retrain script
    // For now, we'll just log the capability
    console.log('Drift alert system ready');
    console.log('Configure ADMIN_EMAIL environment variable to enable email alerts');

    if (process.env.ADMIN_EMAIL) {
      console.log(`Alert system configured for: ${process.env.ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error('Alert system error:', error);
    process.exit(1);
  }
}

main();