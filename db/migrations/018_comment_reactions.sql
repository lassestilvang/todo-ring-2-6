-- Comment Reactions table for emoji reactions on comments
CREATE TABLE IF NOT EXISTS comment_reactions (
    id TEXT PRIMARY KEY,
    comment_id TEXT NOT NULL REFERENCES task_comments(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user ON comment_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_emoji ON comment_reactions(emoji);