-- Saved Views table for saving filter configurations
CREATE TABLE IF NOT EXISTS saved_views (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🔍',
    filters TEXT NOT NULL DEFAULT '{}',
    layout TEXT DEFAULT 'list',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_views_user ON saved_views(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_views_name ON saved_views(name);