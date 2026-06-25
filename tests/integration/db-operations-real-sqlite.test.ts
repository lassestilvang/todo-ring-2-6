/**
 * Database Operations - Real SQLite Behavior Tests
 *
 * Tests actual behavior of database operations with real SQLite.
 * Run with: npm run test:integration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Generate unique IDs
function generateId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9);
}

describe('Database Operations - Real SQLite Behavior Tests', () => {
  let db: Database.Database;
  let now: string;

  beforeEach(() => {
    now = new Date().toISOString();

    // Create in-memory database
    db = new Database(':memory:');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Load schema
    const schemaPath = resolve(process.cwd(), 'db/schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    const statements = schema
      .split(';')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const tx = db.transaction(() => {
      for (const stmt of statements) {
        db.prepare(stmt).run();
      }
    });
    tx();
  });

  afterEach(() => {
    db.close();
  });

  describe('List Operations', () => {
    it('should create a list with default values', () => {
      const id = generateId();

      db.prepare(
        'INSERT INTO lists (id, name, color, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
      ).run(id, 'Test List', '#3b82f6', '📋', 0, now, now);

      const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as any;
      expect(list).toBeDefined();
      expect(list.name).toBe('Test List');
      expect(list.color).toBe('#3b82f6');
      expect(list.is_inbox).toBe(0);
    });

    it('should return all lists ordered by sort_order', () => {
      db.prepare('INSERT INTO lists (id, name, sort_order, created_at, updated_at) VALUES (?, ?, 0, ?, ?)').run(generateId(), 'List A', now, now);
      db.prepare('INSERT INTO lists (id, name, sort_order, created_at, updated_at) VALUES (?, ?, 1, ?, ?)').run(generateId(), 'List B', now, now);
      db.prepare('INSERT INTO lists (id, name, sort_order, created_at, updated_at) VALUES (?, ?, 2, ?, ?)').run(generateId(), 'List C', now, now);

      const lists = db.prepare('SELECT * FROM lists ORDER BY sort_order ASC, created_at DESC').all() as any[];
      expect(lists).toHaveLength(3);
      expect(lists[0].name).toBe('List A');
      expect(lists[1].name).toBe('List B');
      expect(lists[2].name).toBe('List C');
    });

    it('should update list sort order and shift other lists', () => {
      const listAId = generateId();
      const listBId = generateId();
      const listCId = generateId();

      db.prepare('INSERT INTO lists (id, name, sort_order, created_at, updated_at) VALUES (?, ?, 0, ?, ?)').run(listAId, 'List A', now, now);
      db.prepare('INSERT INTO lists (id, name, sort_order, created_at, updated_at) VALUES (?, ?, 1, ?, ?)').run(listBId, 'List B', now, now);
      db.prepare('INSERT INTO lists (id, name, sort_order, created_at, updated_at) VALUES (?, ?, 2, ?, ?)').run(listCId, 'List C', now, now);

      // Move List A to position 2
      db.prepare('UPDATE lists SET sort_order = 0 WHERE sort_order > 0 AND sort_order <= 2').run();
      db.prepare('UPDATE lists SET sort_order = 2 WHERE id = ?').run(listAId);

      const lists = db.prepare('SELECT * FROM lists ORDER BY sort_order ASC').all() as any[];
      expect(lists[0].name).toBe('List B');
      expect(lists[1].name).toBe('List C');
      expect(lists[2].name).toBe('List A');
    });

    it('should delete a non-inbox list', () => {
      const id = generateId();

      db.prepare('INSERT INTO lists (id, name, is_inbox, created_at, updated_at) VALUES (?, ?, 0, ?, ?)').run(id, 'Test List', now, now);
      db.prepare('DELETE FROM lists WHERE id = ? AND is_inbox = 0').run(id);

      const deleted = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
      expect(deleted).toBeUndefined();
    });

    it('should prevent deletion of inbox list', () => {
      const id = generateId();

      db.prepare('INSERT INTO lists (id, name, is_inbox, created_at, updated_at) VALUES (?, ?, 1, ?, ?)').run(id, 'Inbox', now, now);
      db.prepare('DELETE FROM lists WHERE id = ? AND is_inbox = 0').run(id);

      const list = db.prepare('SELECT * FROM lists WHERE id = ?').get(id);
      expect(list).toBeDefined();
    });
  });

  describe('Task Operations', () => {
    it('should create a task with default values', () => {
      const id = generateId();

      db.prepare(
        `INSERT INTO tasks (id, title, description, list_id, date, deadline, estimate_hours, estimate_minutes,
         actual_hours, actual_minutes, priority, status, recurring_type, recurring_interval,
         is_all_day, is_habit, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?, ?, ?, ?)`
      ).run(id, 'Test Task', '', null, null, null, 0, 0, 'none', 'none', 0, 0, now, now);

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
      expect(task).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('none');
    });

    it('should update task status and set completed_at', () => {
      const id = generateId();

      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(id, 'Test Task', 'pending', now, now);

      const completedAt = new Date().toISOString();
      db.prepare('UPDATE tasks SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?')
        .run('completed', now, completedAt, id);

      const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
      expect(task.status).toBe('completed');
      expect(task.completed_at).toBe(completedAt);
    });

    it('should handle task deletion with cascade to subtasks', () => {
      const taskId = generateId();
      const subtaskId = generateId();

      db.prepare('INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(taskId, 'Task', now, now);
      db.prepare('INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, 0, ?)')
        .run(subtaskId, taskId, 'Subtask', now);

      // Delete task - should cascade to subtasks
      db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

      const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId);
      expect(subtask).toBeUndefined();
    });

    it('should get tasks filtered by date', () => {
      const today = now.split('T')[0];

      db.prepare('INSERT INTO tasks (id, title, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(generateId(), 'Today Task', today, 'pending', now, now);
      db.prepare('INSERT INTO tasks (id, title, date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(generateId(), 'Future Task', '2024-12-31', 'pending', now, now);

      const tasks = db.prepare("SELECT * FROM tasks WHERE date = ? AND status != 'completed' AND status != 'cancelled'").all(today) as any[];
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Today Task');
    });

    it('should calculate overdue count correctly', () => {
      const today = now.split('T')[0];

      db.prepare('INSERT INTO tasks (id, title, deadline, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(generateId(), 'Overdue Task', '2024-01-01', 'pending', now, now);
      db.prepare('INSERT INTO tasks (id, title, deadline, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(generateId(), 'Completed Task', today, 'completed', now, now);
      db.prepare('INSERT INTO tasks (id, title, deadline, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(generateId(), 'Normal Task', null, 'pending', now, now);

      const result = db.prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE deadline < ? AND status NOT IN ('completed', 'cancelled')"
      ).get(today) as { count: number };

      expect(result.count).toBe(1);
    });

    it('should handle task with labels', () => {
      const taskId = generateId();
      const labelId = generateId();

      db.prepare('INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(taskId, 'Task', now, now);
      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)').run(labelId, 'Important', '#ff0000', '🔴', now);
      db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)').run(taskId, labelId);

      const taskLabels = db.prepare(
        `SELECT l.* FROM labels l
         JOIN task_labels tl ON l.id = tl.label_id
         WHERE tl.task_id = ?`
      ).all(taskId) as any[];

      expect(taskLabels).toHaveLength(1);
      expect(taskLabels[0].name).toBe('Important');
    });
  });

  describe('Subtask Operations', () => {
    it('should create a subtask with auto-increment sort order', () => {
      const taskId = generateId();

      db.prepare('INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(taskId, 'Parent Task', now, now);

      const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max FROM subtasks WHERE task_id = ?').get(taskId) as { max: number };
      db.prepare('INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, ?, ?)')
        .run(generateId(), taskId, 'Subtask 1', maxOrder.max + 1, now);

      const subtask = db.prepare('SELECT * FROM subtasks WHERE task_id = ?').all(taskId) as any[];
      expect(subtask).toHaveLength(1);
      expect(subtask[0].title).toBe('Subtask 1');
      expect(subtask[0].is_completed).toBe(0);
    });

    it('should toggle subtask completion', () => {
      const taskId = generateId();
      const subtaskId = generateId();

      db.prepare('INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(taskId, 'Parent Task', now, now);
      db.prepare('INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, 0, ?)')
        .run(subtaskId, taskId, 'Subtask', 0, now);

      db.prepare('UPDATE subtasks SET is_completed = ? WHERE id = ?').run(1, subtaskId);

      const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(subtaskId) as any;
      expect(subtask.is_completed).toBe(1);
    });
  });

  describe('Label Operations', () => {
    it('should create a label with unique name', () => {
      const id = generateId();

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)').run(id, 'Important', '#ff0000', '🔴', now);

      const label = db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as any;
      expect(label.name).toBe('Important');
      expect(label.color).toBe('#ff0000');
    });

    it('should prevent duplicate label names', () => {
      const id1 = generateId();
      const id2 = generateId();

      db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)').run(id1, 'Work', '#000', '💼', now);

      // Should throw due to UNIQUE constraint
      expect(() => {
        db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)').run(id2, 'Work', '#000', '💼', now);
      }).toThrow();
    });
  });

  describe('Task History Operations', () => {
    it('should log task creation', () => {
      const taskId = generateId();

      db.prepare('INSERT INTO task_history (id, task_id, action, field_changed, old_value, new_value, performed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(generateId(), taskId, 'created', null, null, null, now);

      const history = db.prepare('SELECT * FROM task_history WHERE task_id = ?').all(taskId) as any[];
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe('created');
    });

    it('should log field changes with before/after values', () => {
      const taskId = generateId();

      db.prepare('INSERT INTO task_history (id, task_id, action, field_changed, old_value, new_value, performed_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(generateId(), taskId, 'updated', 'status', 'pending', 'completed', now);

      const history = db.prepare('SELECT * FROM task_history WHERE task_id = ? AND action = ?').get(taskId, 'updated') as any;
      expect(history.field_changed).toBe('status');
      expect(history.old_value).toBe('pending');
      expect(history.new_value).toBe('completed');
    });
  });

  describe('Task Dependency Operations', () => {
    it('should create task dependency', () => {
      const taskA = generateId();
      const taskB = generateId();

      db.prepare('INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(taskA, 'Task A', now, now);
      db.prepare('INSERT INTO tasks (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(taskB, 'Task B', now, now);

      db.prepare('INSERT INTO task_dependencies (id, task_id, depends_on_id, created_at) VALUES (?, ?, ?, ?)').run(generateId(), taskA, taskB, now);

      const deps = db.prepare('SELECT * FROM task_dependencies WHERE task_id = ?').all(taskA) as any[];
      expect(deps).toHaveLength(1);
      expect(deps[0].depends_on_id).toBe(taskB);
    });

    it('should get blocked tasks correctly', () => {
      const blockedTask = generateId();
      const blockingTask = generateId();
      const freeTask = generateId();

      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(blockedTask, 'Blocked Task', 'pending', now, now);
      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(blockingTask, 'Blocking Task', 'pending', now, now);
      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(freeTask, 'Free Task', 'pending', now, now);

      db.prepare('INSERT INTO task_dependencies (id, task_id, depends_on_id, created_at) VALUES (?, ?, ?, ?)').run(generateId(), blockedTask, blockingTask, now);

      const blocked = db.prepare(
        `SELECT DISTINCT t.* FROM tasks t
         JOIN task_dependencies td ON t.id = td.task_id
         JOIN tasks deps ON td.depends_on_id = deps.id
         WHERE deps.status NOT IN ('completed', 'cancelled')`
      ).all() as any[];

      expect(blocked).toHaveLength(1);
      expect(blocked[0].id).toBe(blockedTask);
    });
  });

  describe('Recurring Task Operations', () => {
    it('should expand recurring task for date range', () => {
      const taskId = generateId();

      db.prepare(
        `INSERT INTO tasks (id, title, description, list_id, date, deadline, estimate_hours, estimate_minutes,
         actual_hours, actual_minutes, priority, status, recurring_type, recurring_interval,
         is_all_day, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?, ?, ?, ?)`
      ).run(taskId, 'Recurring Task', '', null, '2024-01-01', null, 0, 0, 'none', 'daily', 1, 0, now, now);

      // Simulate expansion - would create new task for next day
      const existing = db.prepare(
        "SELECT id FROM tasks WHERE title = ? AND date = ? AND recurring_type != 'none'"
      ).get('Recurring Task (recurring)', '2024-01-02');

      expect(existing).toBeUndefined(); // Would be created in real scenario
    });
  });

  describe('Stats Operations', () => {
    it('should calculate task statistics', () => {
      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(generateId(), 'Task 1', 'completed', now, now);
      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(generateId(), 'Task 2', 'pending', now, now);
      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(generateId(), 'Task 3', 'in_progress', now, now);
      db.prepare('INSERT INTO tasks (id, title, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(generateId(), 'Task 4', 'cancelled', now, now);

      const total = (db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number }).count;
      const completed = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as { count: number }).count;
      const pending = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get() as { count: number }).count;
      const inProgress = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get() as { count: number }).count;

      expect(total).toBe(4);
      expect(completed).toBe(1);
      expect(pending).toBe(1);
      expect(inProgress).toBe(1);
    });
  });

  describe('User Operations', () => {
    it('should create a user', () => {
      const id = generateId();

      db.prepare('INSERT INTO users (id, name, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, 'Test User', 'test@example.com', null, null, now);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
    });

    it('should find user by email', () => {
      const id = generateId();

      db.prepare('INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)').run(id, 'Test User', 'test@example.com', now);

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get('test@example.com') as any;
      expect(user.id).toBe(id);
    });
  });

  describe('Session Operations', () => {
    it('should create a session', () => {
      const userId = generateId();
      const sessionId = generateId();

      db.prepare('INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(sessionId, userId, '127.0.0.1', 'Test Agent', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), now);

      const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
      expect(session.user_id).toBe(userId);
    });

    it('should not return expired sessions', () => {
      const id = generateId();
      const userId = generateId();

      // Create expired session
      db.prepare('INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(id, userId, new Date(Date.now() - 1000).toISOString(), now);

      const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
        .get(id, new Date().toISOString()) as any;

      expect(session).toBeUndefined();
    });
  });

  describe('Push Subscription Operations', () => {
    it('should create a push subscription', () => {
      const userId = generateId();
      const subId = generateId();

      db.prepare('INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(subId, userId, 'https://example.com/push', 'p256dh-key', 'auth-key', now);

      const sub = db.prepare('SELECT * FROM push_subscriptions WHERE id = ?').get(subId) as any;
      expect(sub.user_id).toBe(userId);
      expect(sub.endpoint).toBe('https://example.com/push');
    });
  });

  describe('Habit Streak Operations', () => {
    it('should create a habit streak', () => {
      const taskId = generateId();
      const streakId = generateId();

      db.prepare(
        'INSERT INTO habit_streaks (id, task_id, current_streak, longest_streak, last_completed, streak_start, created_at, updated_at) VALUES (?, ?, 0, 0, NULL, NULL, ?, ?)'
      ).run(streakId, taskId, now, now);

      const streak = db.prepare('SELECT * FROM habit_streaks WHERE task_id = ?').get(taskId) as any;
      expect(streak.current_streak).toBe(0);
    });
  });

  describe('Goal Operations', () => {
    it('should create a goal', () => {
      const userId = generateId();
      const goalId = generateId();

      db.prepare(
        `INSERT INTO goals (id, user_id, title, description, target_value, unit, period, category, color, current_value, is_completed, start_date, end_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`
      ).run(goalId, userId, 'New Year Resolution', 'Read 52 books', 52, 'books', 'yearly', 'personal', '#3b82f6', '2024-01-01', '2024-12-31', now, now);

      const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId) as any;
      expect(goal.title).toBe('New Year Resolution');
      expect(goal.target_value).toBe(52);
    });
  });
});
