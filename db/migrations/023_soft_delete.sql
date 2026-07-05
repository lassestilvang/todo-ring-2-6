-- Soft delete migration for tasks, lists, and labels
-- Adds deleted_at column for soft delete support

-- Check if deleted_at column exists before adding
-- Tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TEXT;

-- Lists table
ALTER TABLE lists ADD COLUMN IF NOT EXISTS deleted_at TEXT;

-- Labels table
ALTER TABLE labels ADD COLUMN IF NOT EXISTS deleted_at TEXT;

-- Create indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_lists_deleted ON lists(deleted_at);
CREATE INDEX IF NOT EXISTS idx_labels_deleted ON labels(deleted_at);

-- Comments table
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS deleted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON task_comments(deleted_at);