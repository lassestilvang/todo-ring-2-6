-- Focus Time Budgets Migration
-- Daily/weekly focus hours allocation with burnout prevention

CREATE TABLE IF NOT EXISTS focus_time_budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  daily_limit REAL DEFAULT 8,
  weekly_limit REAL DEFAULT 40,
  work_start_hour INTEGER DEFAULT 9,
  work_end_hour INTEGER DEFAULT 17,
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '08:00',
  burnout_warning_threshold REAL DEFAULT 0.8,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_focus_budgets_user ON focus_time_budgets(user_id);