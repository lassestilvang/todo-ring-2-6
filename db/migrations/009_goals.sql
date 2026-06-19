-- Goal Tracking Schema
-- Allows users to set weekly/monthly goals with progress tracking

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  target_value REAL NOT NULL, -- The target number (e.g., 10 tasks, 5 hours)
  unit TEXT NOT NULL DEFAULT 'tasks', -- e.g., 'tasks', 'hours', 'minutes'
  period TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'yearly'
  category TEXT DEFAULT 'general', -- e.g., 'productivity', 'health', 'learning'
  color TEXT DEFAULT '#3b82f6', -- Hex color for visualization
  current_value REAL DEFAULT 0,
  is_completed INTEGER DEFAULT 0,
  start_date TEXT NOT NULL, -- YYYY-MM-DD
  end_date TEXT NOT NULL, -- YYYY-MM-DD
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_period ON goals(period);
CREATE INDEX IF NOT EXISTS idx_goals_dates ON goals(start_date, end_date);