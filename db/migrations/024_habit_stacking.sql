-- Habit Stacking Migration
-- Enables behavior chaining where completing one habit triggers another

CREATE TABLE IF NOT EXISTS habit_stacks (
  id TEXT PRIMARY KEY,
  anchor_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  linked_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(anchor_task_id, linked_task_id)
);

CREATE INDEX IF NOT EXISTS idx_habit_stacks_anchor ON habit_stacks(anchor_task_id);
CREATE INDEX IF NOT EXISTS idx_habit_stacks_linked ON habit_stacks(linked_task_id);