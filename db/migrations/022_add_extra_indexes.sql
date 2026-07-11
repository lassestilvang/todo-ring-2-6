-- Migration script to add performance indexes

-- Task assignee and date composite index (for user's scheduled tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(assignee_id, date);

-- Tasks status and priority index (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks(status, priority);

-- Saved views query optimization
CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_name ON saved_views(name);

-- Task dependencies index for cascade updates
CREATE INDEX IF NOT EXISTS idx_deps_task_id ON tasks_dependencies(task_id);

-- Calendar events index (if using calendar feature)
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);

-- Analytics aggregation index
CREATE INDEX IF NOT EXISTS idx_task_stats_update ON task_stats(update_time);