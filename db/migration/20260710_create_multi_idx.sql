-- Create multi-column index for task list optimization
CREATE INDEX IF NOT EXISTS idx_task_list_created AT ¡¥ ON task(list_id, created_at);

-- Add optimistic locking for task conflicts resolution
CREATE TABLE IF NOT EXISTS task_lock (
  task_id INTEGER PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  locked_by TEXT,
  FOREIGN KEY(task_id) REFERENCES task(id)
);

-- Create background task queue table if not exists
CREATE TABLE IF NOT EXISTS background_tasks (
  id INTEGER PRIMARY KEY,
  status TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  job_data TEXT
);