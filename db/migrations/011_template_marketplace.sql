-- Template Marketplace Migration
-- Adds is_public flag and updates template_ratings table

-- Add is_public column to task_templates for marketplace visibility
ALTER TABLE task_templates ADD COLUMN is_public INTEGER DEFAULT 0;
ALTER TABLE task_templates ADD COLUMN download_count INTEGER DEFAULT 0;

-- Create index for public templates query
CREATE INDEX IF NOT EXISTS idx_templates_public ON task_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_templates_downloads ON task_templates(download_count DESC);

-- Update template_ratings to include user_id for proper rating tracking
ALTER TABLE template_ratings ADD COLUMN user_id TEXT;
CREATE INDEX IF NOT EXISTS idx_template_ratings_user ON template_ratings(user_id);