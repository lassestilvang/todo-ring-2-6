-- Task Assignment System Migration
-- Adds assignee fields to tasks table for team collaboration

-- Add assignee columns to tasks table
ALTER TABLE tasks ADD COLUMN assignee_id TEXT;
ALTER TABLE tasks ADD COLUMN assignee_name TEXT;

-- Create index for faster assignee queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

-- Create index for assignee + status queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status);

-- Template ratings table (for marketplace)
CREATE TABLE IF NOT EXISTS template_ratings (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    created_at TEXT NOT NULL,
    FOREIGN KEY (template_id) REFERENCES task_templates(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_template_ratings_template ON template_ratings(template_id);

-- Add avg_rating to existing templates
ALTER TABLE task_templates ADD COLUMN avg_rating REAL DEFAULT 0;