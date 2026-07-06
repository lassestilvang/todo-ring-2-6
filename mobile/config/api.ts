/**
 * Mobile App API Configuration
 * Uses environment variables for API URL configuration
 * All endpoints use /api/v1/ for consistency
 */

// Default to localhost for development, can be overridden with MOBILE_API_URL env var
const DEFAULT_API_URL = 'http://localhost:3000';

// For production, you would use:
// const DEFAULT_API_URL = 'https://api.taskplanner.app';

export const API_URL = process.env.MOBILE_API_URL || DEFAULT_API_URL;

export const ENDPOINTS = {
  tasks: `${API_URL}/api/v1/tasks`,
  subtasks: `${API_URL}/api/v1/subtasks`,
  lists: `${API_URL}/api/v1/lists`,
  auth: `${API_URL}/api/v1/auth`,
  comments: `${API_URL}/api/v1/comments`,
  labels: `${API_URL}/api/v1/labels`,
  goals: `${API_URL}/api/v1/goals`,
  analytics: `${API_URL}/api/v1/analytics`,
  habits: `${API_URL}/api/v1/habit-streaks`,
  timeEntries: `${API_URL}/api/v1/time-entries`,
  timeTrackingSummary: `${API_URL}/api/v1/time-tracking/summary`,
  themes: `${API_URL}/api/v1/themes`,
  templates: `${API_URL}/api/v1/templates`,
  templateMarketplace: `${API_URL}/api/v1/templates/marketplace`,
  notificationSettings: `${API_URL}/api/v1/notification-settings`,
  reminders: `${API_URL}/api/v1/reminders`,
  dependencies: `${API_URL}/api/v1/dependencies`,
  teams: `${API_URL}/api/v1/teams`,
  teamsWorkload: `${API_URL}/api/v1/teams/workload`,
  automation: `${API_URL}/api/v1/automation`,
  focusSessions: `${API_URL}/api/v1/focus-sessions`,
  aiAssistant: `${API_URL}/api/v1/ai-assistant`,
  aiSchedule: `${API_URL}/api/v1/ai/schedule`,
  aiConflicts: `${API_URL}/api/v1/ai/conflicts`,
  export: `${API_URL}/api/v1/export`,
  exportScheduled: `${API_URL}/api/v1/export/scheduled`,
  import: `${API_URL}/api/v1/import`,
  savedViews: `${API_URL}/api/v1/saved-views`,
  // New endpoints for mobile parity
  timeBlocking: `${API_URL}/api/v1/time-blocking`,
  calendar: `${API_URL}/api/v1/calendar`,
  pushSubscription: `${API_URL}/api/v1/push-subscription`,
  taskHistory: `${API_URL}/api/v1/task-history`,
  recurringExceptions: `${API_URL}/api/v1/recurring/exceptions`,
  goalProgress: `${API_URL}/api/v1/goals/progress`,
  taskBatches: `${API_URL}/api/v1/task-batches`,
};

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});