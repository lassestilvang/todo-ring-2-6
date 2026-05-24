import { getDb } from '../db/index.js';
import type { List, Task, Subtask, Label, TaskLabel, TaskHistory } from '../src/types/index.js';

// === List Operations ===

export function getAllLists(): List[] {
  const db = getDb();
  return db.prepare('SELECT * FROM lists ORDER BY sort_order ASC, created_at DESC').all() as List[];
}

export function getListById(id: string): List | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List | undefined;
}

export function getInboxList(): List {
  const db = getDb();
  let list = db.prepare("SELECT * FROM lists WHERE is_inbox = 1").get() as List | undefined;
  if (!list) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO lists (id, name, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, 1, 0, ?, ?)'
    ).run(id, 'Inbox', '📥', now, now);
    list = db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List;
  }
  return list;
}

export function createList(data: { name: string; color: string; emoji: string }): List {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max FROM lists').get() as { max: number };
  
  db.prepare(
    'INSERT INTO lists (id, name, color, emoji, is_inbox, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?, ?)'
  ).run(id, data.name, data.color, data.emoji, maxOrder.max + 1, now, now);
  
  return db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List;
}

export function updateList(id: string, data: Partial<{ name: string; color: string; emoji: string }>): List {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.emoji !== undefined) { updates.push('emoji = ?'); values.push(data.emoji); }
  updates.push('updated_at = ?'); values.push(now);
  values.push(id);
  
  db.prepare(`UPDATE lists SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM lists WHERE id = ?').get(id) as List;
}

export function deleteList(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM lists WHERE id = ? AND is_inbox = 0').run(id);
}

// === Task Operations ===

export function getTaskById(id: string): Task | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
}

export function getTasks(listId?: string, date?: string): Task[] {
  const db = getDb();
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const values: (string | number)[] = [];
  
  if (listId) {
    query += ' AND list_id = ?';
    values.push(listId);
  }
  if (date) {
    query += ' AND date = ?';
    values.push(date);
  }
  
  query += ' ORDER BY sort_order ASC, created_at DESC';
  return db.prepare(query).all(...values) as Task[];
}

export function getAllTasks(): Task[] {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks ORDER BY sort_order ASC, created_at DESC').all() as Task[];
}

export function getInboxTasks(): Task[] {
  const inbox = getInboxList();
  return getTasks(inbox.id);
}

export function getTasksForToday(): Task[] {
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();
  return db.prepare(
    "SELECT * FROM tasks WHERE date = ? AND status != 'completed' AND status != 'cancelled' ORDER BY sort_order ASC"
  ).all(today) as Task[];
}

export function getTasksForNext7Days(): Task[] {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const db = getDb();
  return db.prepare(
    "SELECT * FROM tasks WHERE date BETWEEN ? AND ? AND status != 'completed' AND status != 'cancelled' ORDER BY date ASC, sort_order ASC"
  ).all(startDate, endDate) as Task[];
}

export function getUpcomingTasks(): Task[] {
  const today = new Date().toISOString().split('T')[0];
  const db = getDb();
  return db.prepare(
    "SELECT * FROM tasks WHERE date >= ? AND status != 'completed' AND status != 'cancelled' ORDER BY date ASC, sort_order ASC"
  ).all(today) as Task[];
}

export function createTask(data: {
  title: string;
  description?: string;
  listId?: string | null;
  date?: string | null;
  deadline?: string | null;
  estimateHours?: number;
  estimateMinutes?: number;
  priority?: string;
  recurringType?: string;
  recurringInterval?: string;
  isAllDay?: boolean;
}): Task {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const inbox = getInboxList();
  const listId = data.listId ?? inbox.id;
  
  db.prepare(`
    INSERT INTO tasks 
    (id, title, description, list_id, date, deadline, estimate_hours, estimate_minutes, 
     actual_hours, actual_minutes, priority, status, recurring_type, recurring_interval, 
     is_all_day, sort_order, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?, 
    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks), ?, ?)
  `).run(
    id, data.title, data.description || '', listId, data.date || null, 
    data.deadline || null, data.estimateHours || 0, data.estimateMinutes || 0,
    data.priority || 'none', data.recurringType || 'none', 
    data.recurringInterval || '', data.isAllDay ? 1 : 0, now, now
  );
  
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  
  // Log history
  addTaskHistory(id, 'created', null, null, JSON.stringify(task));
  
  return task;
}

export function updateTask(id: string, data: Partial<{
  title: string;
  description: string;
  listId: string | null;
  date: string | null;
  deadline: string | null;
  estimateHours: number;
  estimateMinutes: number;
  actualHours: number;
  actualMinutes: number;
  priority: string;
  status: string;
  recurringType: string;
  recurringInterval: string;
  isAllDay: boolean;
}>): Task {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getTaskById(id);
  if (!existing) throw new Error('Task not found');
  
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  
  const fieldMap: Record<string, { col: string; val: any }> = {
    title: { col: 'title', val: data.title },
    description: { col: 'description', val: data.description },
    listId: { col: 'list_id', val: data.listId },
    date: { col: 'date', val: data.date },
    deadline: { col: 'deadline', val: data.deadline },
    estimateHours: { col: 'estimate_hours', val: data.estimateHours },
    estimateMinutes: { col: 'estimate_minutes', val: data.estimateMinutes },
    actualHours: { col: 'actual_hours', val: data.actualHours },
    actualMinutes: { col: 'actual_minutes', val: data.actualMinutes },
    priority: { col: 'priority', val: data.priority },
    status: { col: 'status', val: data.status },
    recurringType: { col: 'recurring_type', val: data.recurringType },
    recurringInterval: { col: 'recurring_interval', val: data.recurringInterval },
    isAllDay: { col: 'is_all_day', val: data.isAllDay ? 1 : 0 },
  };
  
  for (const [key, { col, val }] of Object.entries(fieldMap)) {
    if (data[key as keyof typeof data] !== undefined) {
      updates.push(`${col} = ?`);
      values.push(val);
      
      // Log history
      const oldVal = existing[key as keyof typeof existing];
      if (oldVal !== val) {
        addTaskHistory(id, 'updated', col, String(oldVal), String(val));
      }
    }
  }
  
  if (updates.length === 0) return existing;
  
  updates.push('updated_at = ?');
  values.push(now);
  values.push(id);
  
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
}

export function deleteTask(id: string): void {
  const db = getDb();
  addTaskHistory(id, 'deleted', null, null, null);
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function toggleTaskStatus(id: string): Task {
  const db = getDb();
  const task = getTaskById(id);
  if (!task) throw new Error('Task not found');
  
  const newStatus = task.status === 'completed' ? 'pending' : 'completed';
  const now = new Date().toISOString();
  
  db.prepare('UPDATE tasks SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?')
    .run(newStatus, now, newStatus === 'completed' ? now : null, id);
  
  addTaskHistory(id, newStatus === 'completed' ? 'completed' : 'reopened', 'status', task.status, newStatus);
  
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
}

// === Subtask Operations ===

export function getSubtasks(taskId: string): Subtask[] {
  const db = getDb();
  return db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC').all(taskId) as Subtask[];
}

export function createSubtask(data: { taskId: string; title: string }): Subtask {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const maxOrder = db.prepare('SELECT COALESCE(MAX(sort_order), 0) as max FROM subtasks WHERE task_id = ?').get(data.taskId) as { max: number };
  
  db.prepare('INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, ?, ?)')
    .run(id, data.taskId, data.title, maxOrder.max + 1, now);
  
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask;
}

export function toggleSubtask(id: string): Subtask {
  const db = getDb();
  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask;
  const newStatus = !subtask.isCompleted;
  
  db.prepare('UPDATE subtasks SET is_completed = ? WHERE id = ?').run(newStatus ? 1 : 0, id);
  
  // Auto-complete task if all subtasks are done
  const allSubtasks = getSubtasks(subtask.taskId);
  const allDone = allSubtasks.every(s => {
    if (s.id === id) return newStatus;
    return s.isCompleted;
  });
  
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id) as Subtask;
}

export function deleteSubtask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
}

// === Label Operations ===

export function getAllLabels(): Label[] {
  const db = getDb();
  return db.prepare('SELECT * FROM labels ORDER BY name ASC').all() as Label[];
}

export function getLabelById(id: string): Label | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label | undefined;
}

export function createLabel(data: { name: string; color: string; icon?: string }): Label {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, data.name, data.color, data.icon || '🏷', now);
  
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label;
}

export function updateLabel(id: string, data: Partial<{ name: string; color: string; icon: string }>): Label {
  const db = getDb();
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.icon !== undefined) { updates.push('icon = ?'); values.push(data.icon); }
  values.push(id);
  
  db.prepare(`UPDATE labels SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id) as Label;
}

export function deleteLabel(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM labels WHERE id = ?').run(id);
}

// === Task-Label Operations ===

export function getTaskLabels(taskId: string): Label[] {
  const db = getDb();
  return db.prepare(`
    SELECT l.* FROM labels l
    JOIN task_labels tl ON l.id = tl.label_id
    WHERE tl.task_id = ?
  `).all(taskId) as Label[];
}

export function addLabelToTask(taskId: string, labelId: string): void {
  const db = getDb();
  db.prepare('INSERT OR IGNORE INTO task_labels (task_id, label_id) VALUES (?, ?)').run(taskId, labelId);
}

export function removeLabelFromTask(taskId: string, labelId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(taskId, labelId);
}

// === Task History Operations ===

export function addTaskHistory(taskId: string, action: string, fieldChanged?: string | null, oldValue?: string | null, newValue?: string | null): void {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  db.prepare(
    'INSERT INTO task_history (id, task_id, action, field_changed, old_value, new_value, performed_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, taskId, action, fieldChanged, oldValue, newValue, now);
}

export function getTaskHistory(taskId: string): TaskHistory[] {
  const db = getDb();
  return db.prepare('SELECT * FROM task_history WHERE task_id = ? ORDER BY performed_at DESC').all(taskId) as TaskHistory[];
}

// === Search ===

export function searchTasks(query: string): Task[] {
  const db = getDb();
  const searchPattern = `%${query}%`;
  
  // Use FTS5 for better search, fallback to LIKE
  const ftsResults = db.prepare(
    `SELECT t.* FROM tasks t 
     JOIN tasks_fts fts ON t.rowid = fts.rowid 
     WHERE tasks_fts MATCH ? 
     ORDER BY rank`
  ).all(query);
  
  if (ftsResults && (ftsResults as any[]).length > 0) {
    return ftsResults.map((r: any) => {
      delete r.rowid;
      return r as Task;
    });
  }
  
  // Fallback
  return db.prepare(
    'SELECT * FROM tasks WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC'
  ).all(searchPattern, searchPattern) as Task[];
}

// === Stats ===

export function getOverdueCount(): number {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE deadline < ? AND status NOT IN ('completed', 'cancelled')"
  ).get(today) as { count: number };
  return result.count;
}

export function getCompletedTodayCount(): number {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const result = db.prepare(
    "SELECT COUNT(*) as count FROM tasks WHERE status = 'completed' AND completed_at >= ?"
  ).get(today) as { count: number };
  return result.count;
}

export function getTaskStats(): { total: number; completed: number; pending: number; inProgress: number } {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) as count FROM tasks").get() as { count: number }).count;
  const completed = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get() as { count: number }).count;
  const pending = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get() as { count: number }).count;
  const inProgress = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'in_progress'").get() as { count: number }).count;
  return { total, completed, pending, inProgress };
}