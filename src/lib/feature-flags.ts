import { initialize, isEnabled } from 'unleash-client';

// Initialize Unleash client
const unleash = initialize({
  url: process.env.UNLEASH_URL || 'http://localhost:4242/api',
  appName: 'taskplanner',
  instanceId: process.env.UNLEASH_INSTANCE_ID || 'taskplanner-app',
  metricsInterval: 30_000
});

// Feature flag names
export const FEATURES = {
  EMAIL_NOTIFICATIONS: 'email-notifications',
  PUSH_NOTIFICATIONS: 'push-notifications',
  NEW_CALENDAR_SYNC: 'new-calendar-sync',
  ADVANCED_SEARCH: 'advanced-search',
  AUTOMATION_RULES: 'automation-rules'
} as const;

/**
 * Check if a feature flag is enabled
 * @param featureName - Name of the feature flag to check
 * @returns boolean indicating if feature is enabled
 */
export function checkFeature(featureName: keyof typeof FEATURES): boolean {
  return isEnabled(FEATURES[featureName], {});
}

// Graceful shutdown
process.on('SIGTERM', () => unleash.stop());
process.on('SIGINT', () => unleash.stop());

export default unleash;