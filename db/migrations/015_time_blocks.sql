-- Time Blocking Tables
-- Migration: 015

-- Time blocks table for scheduling tasks
CREATE TABLE IF NOT EXISTS time_blocks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_time_blocks_user ON time_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_task ON time_blocks(task_id);
CREATE INDEX IF NOT EXISTS idx_time_blocks_date ON time_blocks(date(start_time));
CREATE INDEX IF NOT EXISTS idx_time_blocks_start ON time_blocks(start_time);

-- Time entries for tracking actual time spent
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT,
    duration_minutes INTEGER NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date(start_time));