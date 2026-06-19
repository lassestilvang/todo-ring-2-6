-- Themes table for custom theme persistence
CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    colors TEXT NOT NULL, -- JSON string of color values
    emoji TEXT DEFAULT '🎨',
    is_custom INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_themes_created_by ON themes(created_by);
CREATE INDEX IF NOT EXISTS idx_themes_custom ON themes(is_custom);