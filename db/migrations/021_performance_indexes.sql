-- Performance indexes for frequently queried columns and composite queries
-- These indexes improve query performance for common access patterns

-- Task assignee and status composite index (for workload views)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(assignee_id, status);

-- Task assignee and date composite index (for user's scheduled tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(assignee_id, date);

-- Reminders scheduled queries (for notification processing)
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders(is_fired, remind_at DESC);

-- Goals active filtering (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(user_id, is_completed);

-- Audit log queries by event type (for security monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_time ON audit_logs(event_type, timestamp DESC);

-- Team members with roles (for permission checks)
CREATE INDEX IF NOT EXISTS idx_team_members_lookup ON team_members(team_id, user_id, role);

-- Focus sessions by user and date (for analytics)
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_date ON focus_sessions(user_id, date(started_at));

-- Time entries by task for time tracking reports
CREATE INDEX IF NOT EXISTS idx_time_entries_task_time ON time_entries(task_id, start_time);

-- Task comments for threading
CREATE INDEX IF NOT EXISTS idx_task_comments_thread ON task_comments(task_id, created_at DESC);

-- Template ratings for marketplace sorting
CREATE INDEX IF NOT EXISTS idx_template_ratings_avg ON template_ratings(template_id, rating);

-- Saved views for user-specific views
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);