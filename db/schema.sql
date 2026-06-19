-- TaskPlanner Database Schema
-- SQLite3 compatible

-- Lists table
CREATE TABLE IF NOT EXISTS lists (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    emoji TEXT DEFAULT '📋',
    is_inbox INTEGER DEFAULT 0, -- 1 = Inbox (magic list), 0 = custom
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    list_id TEXT REFERENCES lists(id) ON DELETE CASCADE,
    date TEXT, -- Scheduled date (YYYY-MM-DD)
    deadline TEXT, -- Deadline date (YYYY-MM-DD)
    reminder_time TEXT, -- Reminder datetime (YYYY-MM-DDTHH:mm:ss)
    estimate_hours INTEGER DEFAULT 0,
    estimate_minutes INTEGER DEFAULT 0,
    actual_hours INTEGER DEFAULT 0,
    actual_minutes INTEGER DEFAULT 0,
    priority TEXT DEFAULT 'none' CHECK(priority IN ('high', 'medium', 'low', 'none')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    recurring_type TEXT DEFAULT 'none' CHECK(recurring_type IN ('none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom')),
    recurring_interval TEXT DEFAULT '', -- Custom recurring rule
    is_all_day INTEGER DEFAULT 0,
    is_habit INTEGER DEFAULT 0,
    completed_at TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    assignee_id TEXT, -- User ID of assigned person
    assignee_name TEXT -- Denormalized for display
);

-- Indexes for task assignee queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

-- Labels table
CREATE TABLE IF NOT EXISTS labels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL,
    icon TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

-- Task-Labels junction table (many-to-many)
CREATE TABLE IF NOT EXISTS task_labels (
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id TEXT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

-- Task history/activity log
CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'created', 'updated', 'completed', 'deleted', etc.
    field_changed TEXT, -- field name that was changed
    old_value TEXT,
    new_value TEXT,
    performed_at TEXT NOT NULL
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    file_path TEXT,
    created_at TEXT NOT NULL
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at TEXT NOT NULL,
    method TEXT DEFAULT 'notification' CHECK(method IN ('notification', 'email')),
    is_fired INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Task dependencies (blocking relationships)
CREATE TABLE IF NOT EXISTS task_dependencies (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    UNIQUE(task_id, depends_on_id)
);

-- Task sharing (collaboration)
CREATE TABLE IF NOT EXISTS task_shares (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK(role IN ('viewer', 'editor', 'admin')),
    created_at TEXT NOT NULL
);

-- List sharing
CREATE TABLE IF NOT EXISTS list_shares (
    id TEXT PRIMARY KEY,
    list_id TEXT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    role TEXT DEFAULT 'viewer' CHECK(role IN ('viewer', 'editor', 'admin')),
    created_at TEXT NOT NULL
);

-- Comments on tasks (with threading support)
CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES task_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_comments_parent ON task_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

-- Comment mentions (for @user notifications)
CREATE TABLE IF NOT EXISTS comment_mentions (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    is_notified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comment_mentions_user ON comment_mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_mentions_notified ON comment_mentions(is_notified);

-- Search index for fuzzy search
CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
    title, 
    description,
    content=tasks,
    content_rowid=rowid
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS tasks_ai AFTER INSERT ON tasks BEGIN
    INSERT INTO tasks_fts(rowid, title, description) 
    VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS tasks_ad AFTER DELETE ON tasks BEGIN
    INSERT INTO tasks_fts(tasks_fts, rowid, title, description) 
    VALUES ('delete', old.rowid, old.title, old.description);
END;

CREATE TRIGGER IF NOT EXISTS tasks_au AFTER UPDATE ON tasks BEGIN
    INSERT INTO tasks_fts(tasks_fts, rowid, title, description) 
    VALUES ('delete', old.rowid, old.title, old.description);
    INSERT INTO tasks_fts(rowid, title, description) 
    VALUES (new.rowid, new.title, new.description);
END;

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_list ON tasks(list_id);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Composite indexes for filtered + sorted queries
CREATE INDEX IF NOT EXISTS idx_tasks_status_date ON tasks(status, date);
CREATE INDEX IF NOT EXISTS idx_tasks_status_sort ON tasks(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_tasks_list_status ON tasks(list_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_date_status ON tasks(date, status);

-- Indexes for foreign key joins
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_task ON task_labels(task_id);
CREATE INDEX IF NOT EXISTS idx_task_labels_label ON task_labels(label_id);
CREATE INDEX IF NOT EXISTS idx_history_task ON task_history(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_task ON attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_fired ON reminders(is_fired, remind_at);

-- Task Templates table
CREATE TABLE IF NOT EXISTS task_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📋',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    priority TEXT DEFAULT 'none' CHECK(priority IN ('high', 'medium', 'low', 'none')),
    estimate_hours INTEGER DEFAULT 0,
    estimate_minutes INTEGER DEFAULT 0,
    is_all_day INTEGER DEFAULT 0,
    recurring_type TEXT DEFAULT 'none',
    label_ids TEXT DEFAULT '[]', -- JSON array of label IDs
    category TEXT DEFAULT 'general',
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    avg_rating REAL DEFAULT 0
);

-- Template ratings table (for marketplace)
CREATE TABLE IF NOT EXISTS template_ratings (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_created_by ON task_templates(created_by);

-- Habit streaks table
CREATE TABLE IF NOT EXISTS habit_streaks (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed TEXT,
    streak_start TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_habit_streaks_task ON habit_streaks(task_id);

-- Recurring task exceptions
CREATE TABLE IF NOT EXISTS recurring_exceptions (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    exception_date TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(task_id, exception_date)
);

CREATE INDEX IF NOT EXISTS idx_recurring_exceptions_task ON recurring_exceptions(task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_exceptions_date ON recurring_exceptions(exception_date);

-- Saved filter views
CREATE TABLE IF NOT EXISTS saved_views (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🔍',
    filters TEXT NOT NULL, -- JSON string of filter configuration
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Users table (for comments, sharing, mentions)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    avatar TEXT,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Sessions table for session management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Refresh tokens for JWT refresh
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);

-- MFA secrets for two-factor authentication
CREATE TABLE IF NOT EXISTS mfa_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    secret TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mfa_user ON mfa_secrets(user_id);

-- Audit logs for security events
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    user_id TEXT,
    resource_type TEXT,
    resource_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Push subscriptions for web notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Themes table for custom theme persistence
CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    colors TEXT NOT NULL, -- JSON string of color values
    emoji TEXT DEFAULT '🎨',
    is_custom INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_themes_created_by ON themes(created_by);
CREATE INDEX IF NOT EXISTS idx_themes_custom ON themes(is_custom);

-- Goal Tracking Schema
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    target_value REAL NOT NULL,
    unit TEXT NOT NULL DEFAULT 'tasks',
    period TEXT NOT NULL DEFAULT 'weekly',
    category TEXT DEFAULT 'general',
    color TEXT DEFAULT '#3b82f6',
    current_value REAL DEFAULT 0,
    is_completed INTEGER DEFAULT 0,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_period ON goals(period);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON goals(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_goals_completed ON goals(is_completed);

-- Custom Fields for tasks
CREATE TABLE IF NOT EXISTS custom_fields (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK(field_type IN ('text', 'number', 'date', 'select', 'checkbox', 'textarea')),
    field_value TEXT DEFAULT '',
    label TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_custom_fields_task ON custom_fields(task_id);
CREATE INDEX IF NOT EXISTS idx_custom_fields_key ON custom_fields(field_key);

-- Notification Settings
CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email_notifications INTEGER DEFAULT 1,
    push_notifications INTEGER DEFAULT 1,
    reminder_lead_time INTEGER DEFAULT 15,
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '08:00',
    notification_days TEXT DEFAULT '["monday","tuesday","wednesday","thursday","friday"]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);