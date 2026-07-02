-- Saved View Shares table for sharing saved views
CREATE TABLE IF NOT EXISTS saved_view_shares (
    id TEXT PRIMARY KEY,
    view_id TEXT NOT NULL REFERENCES saved_views(id) ON DELETE CASCADE,
    share_token TEXT NOT NULL UNIQUE,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_saved_view_shares_token ON saved_view_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_saved_view_shares_view ON saved_view_shares(view_id);