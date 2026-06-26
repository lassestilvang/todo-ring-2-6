/**
 * Mobile App API Configuration
 * Uses environment variables for API URL configuration
 */

// Default to localhost for development, can be overridden with MOBILE_API_URL env var
const DEFAULT_API_URL = 'http://localhost:3000';

// For production, you would use:
// const DEFAULT_API_URL = 'https://api.taskplanner.app';

export const API_URL = process.env.MOBILE_API_URL || DEFAULT_API_URL;

export const ENDPOINTS = {
  tasks: `${API_URL}/api/tasks`,
  subtasks: `${API_URL}/api/subtasks`,
  lists: `${API_URL}/api/lists`,
  auth: `${API_URL}/api/auth`,
  comments: `${API_URL}/api/comments`,
  labels: `${API_URL}/api/labels`,
  goals: `${API_URL}/api/goals`,
  analytics: `${API_URL}/api/analytics`,
  habits: `${API_URL}/api/habit-streaks`,
  timeEntries: `${API_URL}/api/time-entries`,
  timeTrackingSummary: `${API_URL}/api/time-tracking/summary`,
  themes: `${API_URL}/api/themes`,
  templates: `${API_URL}/api/templates`,
  templateMarketplace: `${API_URL}/api/templates/marketplace`,
  notificationSettings: `${API_URL}/api/notification-settings`,
  reminders: `${API_URL}/api/reminders`,
  dependencies: `${API_URL}/api/dependencies`,
  teams: `${API_URL}/api/teams`,
  teamsWorkload: `${API_URL}/api/teams/workload`,
  automation: `${API_URL}/api/automation`,
  focusSessions: `${API_URL}/api/focus-sessions`,
  aiAssistant: `${API_URL}/api/ai-assistant`,
  aiSchedule: `${API_URL}/api/ai/schedule`,
  aiConflicts: `${API_URL}/api/ai/conflicts`,
  export: `${API_URL}/api/export`,
  exportScheduled: `${API_URL}/api/export/scheduled`,
  import: `${API_URL}/api/import`,
  savedViews: `${API_URL}/api/saved-views`,
};

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
});