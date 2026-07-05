/**
 * Database Migrations Index
 * Export migration functions for use in the application
 */

export { runMigrations, isMigrationUpToDate } from './migration-runner';
export type { Migration } from './migration-runner';

// Migration file imports (for reference)
// These are automatically loaded by the migration runner
export const MIGRATION_FILES = [
  '001_initial_schema.sql',
  '002_add_reminder_created_at.sql',
  '007_enhanced_auth.sql',
  '008_themes.sql',
  '009_goals.sql',
  '010_task_assignee.sql',
  '011_template_marketplace.sql',
  '012_automation_rules.sql',
  '013_email_templates.sql',
  '014_ai_monitoring.sql',
  '015_time_blocks.sql',
  '016_focus_sessions.sql',
  '017_saved_view_shares.sql',
  '018_comment_reactions.sql',
  '019_saved_views.sql',
  '020_goal_progress.sql',
  '021_performance_indexes.sql',
  '022_recurring_task_exceptions.sql',
  '023_soft_delete.sql',
] as const;