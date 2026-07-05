-- Recurring task exceptions migration
-- This migration was referenced but missing; it's typically created with task-repository

-- Check if the table already exists (from schema.sql)
-- This migration is for ensuring indexes are properly created

CREATE INDEX IF NOT EXISTS idx_recurring_exceptions_task ON recurring_exceptions(task_id);
CREATE INDEX IF NOT EXISTS idx_recurring_exceptions_date ON recurring_exceptions(exception_date);

-- Additional index for quick lookup by task and date range
CREATE INDEX IF NOT EXISTS idx_recurring_exceptions_lookup ON recurring_exceptions(task_id, exception_date);