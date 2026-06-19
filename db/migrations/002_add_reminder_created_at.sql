-- Add created_at and updated_at to reminders table
-- Applied: 2024-06-17
-- Description: Track reminder creation and modification times

ALTER TABLE reminders ADD COLUMN created_at TEXT;
ALTER TABLE reminders ADD COLUMN updated_at TEXT;