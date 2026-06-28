-- AI Assistant Monitoring Tables
-- Migration: 014

-- AI Interactions table
CREATE TABLE IF NOT EXISTS ai_interactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    action TEXT NOT NULL,
    confidence REAL NOT NULL,
    response_time_ms INTEGER NOT NULL,
    success INTEGER DEFAULT 1,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_action ON ai_interactions(action);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON ai_interactions(created_at);

-- AI Feedback table
CREATE TABLE IF NOT EXISTS ai_feedback (
    id TEXT PRIMARY KEY,
    interaction_id TEXT NOT NULL REFERENCES ai_interactions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    was_helpful INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_interaction ON ai_feedback(interaction_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_rating ON ai_feedback(rating);

-- AI Errors table
CREATE TABLE IF NOT EXISTS ai_errors (
    id TEXT PRIMARY KEY,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    user_id TEXT,
    endpoint TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_errors_user ON ai_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_errors_endpoint ON ai_errors(endpoint);
CREATE INDEX IF NOT EXISTS idx_ai_errors_created ON ai_errors(created_at);