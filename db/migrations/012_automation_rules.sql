-- Automation Rules Migration
-- Adds table for user-defined automation rules

CREATE TABLE IF NOT EXISTS automation_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK(trigger_type IN ('task_completed', 'task_created', 'task_updated', 'due_date_passed', 'status_changed', 'priority_changed')),
    trigger_value TEXT, -- JSON for complex trigger conditions
    action_type TEXT NOT NULL CHECK(action_type IN ('create_task', 'update_task', 'set_priority', 'add_label', 'assign_user', 'send_notification')),
    action_value TEXT, -- JSON for action configuration
    is_enabled INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger ON automation_rules(trigger_type);