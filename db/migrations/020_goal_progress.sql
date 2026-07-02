-- Goal Progress table for tracking historical goal progress
CREATE TABLE IF NOT EXISTS goal_progress (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    value REAL NOT NULL,
    recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_goal_progress_goal ON goal_progress(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_recorded ON goal_progress(recorded_at);