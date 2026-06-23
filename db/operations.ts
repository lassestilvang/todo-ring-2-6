import { getDb } from './db-client';
import type { List, Task, Subtask, Label, TaskHistory, TaskDependency, TaskShare, ListShare, TaskComment, Reminder } from '../src/types/index';
import { addDays, addMonths, addYears, isAfter, parseISO } from 'date-fns';

// Re-export getDb for convenience
export { getDb };

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

export function updateListSortOrder(listId: string, newPosition: number): List {
  const db = getDb();
  const list = getListById(listId);
  if (!list) throw new Error('List not found');

  const oldPosition = list.sortOrder;

  // If moving to a higher position, decrement others
  if (newPosition > oldPosition) {
    db.prepare(
      'UPDATE lists SET sort_order = sort_order - 1 WHERE sort_order > ? AND sort_order <= ?'
    ).run(oldPosition, newPosition);
  } else if (newPosition < oldPosition) {
    // If moving to a lower position, increment others
    db.prepare(
      'UPDATE lists SET sort_order = sort_order + 1 WHERE sort_order >= ? AND sort_order < ?'
    ).run(newPosition, oldPosition);
  }

  db.prepare('UPDATE lists SET sort_order = ? WHERE id = ?').run(newPosition, listId);
  return db.prepare('SELECT * FROM lists WHERE id = ?').get(listId) as List;
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
  isHabit?: boolean;
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
     is_all_day, is_habit, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?, ?,
    (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks), ?, ?)
  `).run(
    id, data.title, data.description || '', listId, data.date || null,
    data.deadline || null, data.estimateHours || 0, data.estimateMinutes || 0,
    data.priority || 'none', data.recurringType || 'none',
    data.recurringInterval || '', data.isAllDay ? 1 : 0, data.isHabit ? 1 : 0, now, now
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
  isHabit: boolean;
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
    isHabit: { col: 'is_habit', val: data.isHabit ? 1 : 0 },
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

  // Update habit streak if completing a task
  if (newStatus === 'completed') {
    updateHabitStreakOnComplete(id);
  }

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

export function getTasksByLabel(labelId: string): Task[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.* FROM tasks t
    JOIN task_labels tl ON t.id = tl.task_id
    WHERE tl.label_id = ?
    ORDER BY t.sort_order ASC, t.created_at DESC
  `).all(labelId) as Task[];
}

export function getTasksByLabels(labelIds: string[]): Task[] {
  const db = getDb();
  if (!labelIds || labelIds.length === 0) return [];

  const placeholders = labelIds.map(() => '?').join(',');
  return db.prepare(`
    SELECT t.* FROM tasks t
    WHERE t.id IN (
      SELECT tl.task_id FROM task_labels tl
      WHERE tl.label_id IN (${placeholders})
      GROUP BY tl.task_id
      HAVING COUNT(DISTINCT tl.label_id) = ?
    )
    ORDER BY t.sort_order ASC, t.created_at DESC
  `).all(...labelIds, labelIds.length) as Task[];
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

// === Task Dependencies ===

export function getTaskDependencies(taskId: string): TaskDependency[] {
  const db = getDb();
  return db.prepare(
    `SELECT td.* FROM task_dependencies td
     WHERE td.task_id = ?
     ORDER BY td.created_at DESC`
  ).all(taskId) as TaskDependency[];
}

export function getTaskDependents(taskId: string): TaskDependency[] {
  const db = getDb();
  return db.prepare(
    `SELECT td.* FROM task_dependencies td
     WHERE td.depends_on_id = ?
     ORDER BY td.created_at DESC`
  ).all(taskId) as TaskDependency[];
}

export function addTaskDependency(taskId: string, dependsOnId: string): TaskDependency {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Prevent circular dependencies by checking if the dependency already exists in reverse
  const existing = db.prepare(
    'SELECT id FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?'
  ).get(dependsOnId, taskId);
  if (existing) {
    throw new Error('Circular dependency detected');
  }

  db.prepare(
    'INSERT INTO task_dependencies (id, task_id, depends_on_id, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, taskId, dependsOnId, now);

  return db.prepare('SELECT * FROM task_dependencies WHERE id = ?').get(id) as TaskDependency;
}

export function removeTaskDependency(taskId: string, dependsOnId: string): void {
  const db = getDb();
  db.prepare(
    'DELETE FROM task_dependencies WHERE task_id = ? AND depends_on_id = ?'
  ).run(taskId, dependsOnId);
}

export function getBlockedTasks(): Task[] {
  const db = getDb();
  // Get tasks that have incomplete dependencies
  return db.prepare(
    `SELECT DISTINCT t.* FROM tasks t
     JOIN task_dependencies td ON t.id = td.task_id
     JOIN tasks deps ON td.depends_on_id = deps.id
     WHERE deps.status NOT IN ('completed', 'cancelled')`
  ).all() as Task[];
}

export function canCompleteTask(taskId: string): boolean {
  const db = getDb();
  const task = getTaskById(taskId);
  if (!task || task.status === 'completed' || task.status === 'cancelled') {
    return true; // No dependencies to check
  }

  const blockedBy = db.prepare(
    `SELECT deps.id, deps.title, deps.status FROM task_dependencies td
     JOIN tasks deps ON td.depends_on_id = deps.id
     WHERE td.task_id = ?`
  ).all(taskId) as { id: string; title: string; status: string }[];

  return blockedBy.length === 0 || blockedBy.every(d => d.status === 'completed' || d.status === 'cancelled');
}

// === Task Sharing ===

export function getTaskShares(taskId: string): TaskShare[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM task_shares WHERE task_id = ? ORDER BY created_at DESC'
  ).all(taskId) as TaskShare[];
}

export function addTaskShare(taskId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): TaskShare {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO task_shares (id, task_id, user_id, user_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, taskId, userId, userName, role, now);

  return db.prepare('SELECT * FROM task_shares WHERE id = ?').get(id) as TaskShare;
}

export function removeTaskShare(taskId: string, userId: string): void {
  const db = getDb();
  db.prepare(
    'DELETE FROM task_shares WHERE task_id = ? AND user_id = ?'
  ).run(taskId, userId);
}

// === List Sharing ===

export function getListShares(listId: string): ListShare[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM list_shares WHERE list_id = ? ORDER BY created_at DESC'
  ).all(listId) as ListShare[];
}

export function addListShare(listId: string, userId: string, userName: string, role: 'viewer' | 'editor' | 'admin' = 'viewer'): ListShare {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO list_shares (id, list_id, user_id, user_name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, listId, userId, userName, role, now);

  return db.prepare('SELECT * FROM list_shares WHERE id = ?').get(id) as ListShare;
}

export function removeListShare(listId: string, userId: string): void {
  const db = getDb();
  db.prepare(
    'DELETE FROM list_shares WHERE list_id = ? AND user_id = ?'
  ).run(listId, userId);
}

// === Task Comments ===

export function getTaskComments(taskId: string, includeReplies: boolean = true): TaskComment[] {
  const db = getDb();
  // Get top-level comments first
  const comments = db.prepare(
    'SELECT * FROM task_comments WHERE task_id = ? AND parent_id IS NULL ORDER BY created_at ASC'
  ).all(taskId) as TaskComment[];

  if (!includeReplies) return comments;

  // Get all replies for these comments
  const commentIds = comments.map(c => c.id);
  if (commentIds.length === 0) return [];

  const placeholders = commentIds.map(() => '?').join(',');
  const replies = db.prepare(
    `SELECT * FROM task_comments WHERE parent_id IN (${placeholders}) ORDER BY created_at ASC`
  ).all(...commentIds) as TaskComment[];

  // Build threaded structure
  const commentMap = new Map<string, TaskComment[]>();
  for (const reply of replies) {
    if (!commentMap.has(reply.parentId || '')) {
      commentMap.set(reply.parentId || '', []);
    }
    commentMap.get(reply.parentId || '')!.push(reply);
  }

  // Attach replies to parent comments
  for (const comment of comments) {
    comment.replies = commentMap.get(comment.id) || [];
  }

  return comments;
}

export function getCommentReplies(parentId: string): TaskComment[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM task_comments WHERE parent_id = ? ORDER BY created_at ASC'
  ).all(parentId) as TaskComment[];
}

export function addTaskComment(
  taskId: string,
  userId: string,
  userName: string,
  content: string,
  parentId?: string
): TaskComment {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO task_comments (id, task_id, parent_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, taskId, parentId || null, userId, userName, content, now);

  return db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id) as TaskComment;
}

export function deleteTaskComment(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM task_comments WHERE id = ?').run(id);
}

// === Comment Mention Operations ===

export interface CommentMention {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  isNotified: boolean;
  createdAt: string;
}

export function addCommentMention(data: {
  commentId: string;
  userId: string;
  userName: string;
}): CommentMention {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO comment_mentions (id, comment_id, user_id, user_name, is_notified, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(id, data.commentId, data.userId, data.userName, now);

  return db.prepare('SELECT * FROM comment_mentions WHERE id = ?').get(id) as CommentMention;
}

export function getCommentMentions(commentId: string): CommentMention[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM comment_mentions WHERE comment_id = ? ORDER BY created_at DESC'
  ).all(commentId) as CommentMention[];
}

export function getPendingMentions(userId: string): CommentMention[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM comment_mentions WHERE user_id = ? AND is_notified = 0'
  ).all(userId) as CommentMention[];
}

export function markMentionAsNotified(mentionId: string): void {
  const db = getDb();
  db.prepare('UPDATE comment_mentions SET is_notified = 1 WHERE id = ?').run(mentionId);
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

// === Reminder Operations ===

export function getReminders(taskId?: string): Reminder[] {
  const db = getDb();
  if (taskId) {
    return db.prepare(
      'SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC'
    ).all(taskId) as Reminder[];
  }
  return db.prepare(
    'SELECT * FROM reminders ORDER BY remind_at ASC'
  ).all() as Reminder[];
}

export function getUpcomingReminders(limit: number = 10): Reminder[] {
  const now = new Date().toISOString();
  const db = getDb();
  return db.prepare(
    'SELECT * FROM reminders WHERE remind_at >= ? AND is_fired = 0 ORDER BY remind_at ASC LIMIT ?'
  ).all(now, limit) as Reminder[];
}

export function createReminder(data: {
  taskId: string;
  remindAt: string;
  method?: 'notification' | 'email';
}): Reminder {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO reminders (id, task_id, remind_at, method, is_fired, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(id, data.taskId, data.remindAt, data.method || 'notification', now);

  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder;
}

export function updateReminder(id: string, data: Partial<{ remindAt: string; method: string; isFired: boolean }>): Reminder {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.remindAt !== undefined) { updates.push('remind_at = ?'); values.push(data.remindAt); }
  if (data.method !== undefined) { updates.push('method = ?'); values.push(data.method); }
  if (data.isFired !== undefined) { updates.push('is_fired = ?'); values.push(data.isFired ? 1 : 0); }
  updates.push('updated_at = ?'); values.push(now);
  values.push(id);

  db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder;
}

export function deleteReminder(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
}

// === Task Sorting ===

export function updateTaskSortOrder(taskId: string, newPosition: number): Task {
  const db = getDb();
  const task = getTaskById(taskId);
  if (!task) throw new Error('Task not found');

  const oldPosition = task.sortOrder;

  // If moving to a higher position, decrement others
  if (newPosition > oldPosition) {
    db.prepare(
      'UPDATE tasks SET sort_order = sort_order - 1 WHERE sort_order > ? AND sort_order <= ?'
    ).run(oldPosition, newPosition);
  } else if (newPosition < oldPosition) {
    // If moving to a lower position, increment others
    db.prepare(
      'UPDATE tasks SET sort_order = sort_order + 1 WHERE sort_order >= ? AND sort_order < ?'
    ).run(newPosition, oldPosition);
  }

  db.prepare('UPDATE tasks SET sort_order = ? WHERE id = ?').run(newPosition, taskId);
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as Task;
}

// === Recurrence Engine ===

export function getRecurringTasks(): Task[] {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM tasks WHERE recurring_type != 'none' AND status NOT IN ('completed', 'cancelled')"
  ).all() as Task[];
}

export function calculateNextDate(date: string, recurringType: string, interval?: string): string | null {
  const currentDate = parseISO(date);

  switch (recurringType) {
    case 'daily': {
      const next = addDays(currentDate, interval ? parseInt(interval) : 1);
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'weekly': {
      const next = addDays(currentDate, interval ? parseInt(interval) * 7 : 7);
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'weekdays': {
      // Move to next weekday (Mon-Fri)
      let next = addDays(currentDate, 1);
      while (next.getDay() === 0 || next.getDay() === 6) { // Skip weekends
        next = addDays(next, 1);
      }
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'monthly': {
      const next = addMonths(currentDate, interval ? parseInt(interval) : 1);
      return next.toISOString().split('T')[0] ?? null;
    }
    case 'yearly': {
      const next = addYears(currentDate, interval ? parseInt(interval) : 1);
      return next.toISOString().split('T')[0] ?? null;
    }
    default:
      return null;
  }
}

export function expandRecurringTask(task: Task, endDate: string): Task[] {
  const newTasks: Task[] = [];
  const db = getDb();
  let current = parseISO(task.date || task.createdAt);
  const end = parseISO(endDate);

  // Get exceptions for this task
  const exceptions = getRecurringExceptions(task.id);
  const exceptionSet = new Set(exceptions);

  while (isAfter(end, current) || end.getTime() === current.getTime()) {
    const nextDate = calculateNextDate(
      current.toISOString().split('T')[0] ?? '',
      task.recurringType || 'none',
      task.recurringInterval
    );

    if (!nextDate) break;

    const taskDate = nextDate.split('T')[0] ?? nextDate;

    if (isAfter(parseISO(taskDate), end)) break;

    // Skip if this date is an exception
    if (exceptionSet.has(taskDate)) {
      current = parseISO(nextDate);
      continue;
    }

    // Check if task already exists for this date
    const existing = db.prepare(
      'SELECT id FROM tasks WHERE title = ? AND date = ? AND recurring_type != \'none\''
    ).get(task.title, taskDate) as { id: string } | undefined;

    if (!existing) {
      const newId = crypto.randomUUID();
      db.prepare(`
        INSERT INTO tasks
        (id, title, description, list_id, date, deadline, estimate_hours, estimate_minutes,
         actual_hours, actual_minutes, priority, status, recurring_type, recurring_interval,
         is_all_day, sort_order, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'pending', ?, ?, ?,
        (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM tasks), ?, ?)
      `).run(
        newId,
        `${task.title} (recurring)`,
        task.description,
        task.listId,
        taskDate,
        task.deadline,
        task.estimateHours,
        task.estimateMinutes,
        task.priority,
        task.recurringType,
        task.recurringInterval || '',
        task.isAllDay ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString()
      );

      const createdTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(newId) as Task;
      newTasks.push(createdTask);
    }

    current = parseISO(nextDate);
  }

  return newTasks;
}

export function getRecurringExceptions(taskId: string): string[] {
  const db = getDb();
  return db.prepare(
    'SELECT exception_date FROM recurring_exceptions WHERE task_id = ?'
  ).all(taskId) as string[];
}

export function processRecurringTasks(endDate?: string): Task[] {
  const dateLimit = endDate ?? addDays(new Date(), 30).toISOString().split('T')[0] ?? '';
  const recurringTasks = getRecurringTasks();
  const newlyCreated: Task[] = [];

  for (const task of recurringTasks) {
    const newTasks = expandRecurringTask(task, dateLimit);
    newlyCreated.push(...newTasks);
  }

  return newlyCreated;
}

// === Attachments ===

import type { Attachment } from '../src/types/index.js';

export function getTaskAttachments(taskId: string): Attachment[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC'
  ).all(taskId) as Attachment[];
}

export function createAttachment(data: {
  taskId: string;
  filename: string;
  fileType: string;
  fileSize: number;
  filePath: string;
}): Attachment {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO attachments (id, task_id, filename, file_type, file_size, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, data.taskId, data.filename, data.fileType, data.fileSize, data.filePath, now);

  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as Attachment;
}

export function deleteAttachment(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
}

// === Push Subscription Operations ===

export interface PushSubscriptionData {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
}

export type PushSubscription = PushSubscriptionData;

export function getPushSubscription(id: string): PushSubscription | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM push_subscriptions WHERE id = ?').get(id) as PushSubscription | undefined;
}

export function getPushSubscriptionsForUser(userId: string): PushSubscription[] {
  const db = getDb();
  return db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId) as PushSubscription[];
}

export function createPushSubscription(data: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}): PushSubscription {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, data.userId, data.endpoint, data.p256dh, data.auth, now);

  return db.prepare('SELECT * FROM push_subscriptions WHERE id = ?').get(id) as PushSubscription;
}

export function deletePushSubscription(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(id);
}

export function deletePushSubscriptionsByUserId(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
}

// === Habit Streak Operations ===

export interface HabitStreak {
  id: string;
  taskId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: string | null | undefined;
  streakStart: string | null | undefined;
  createdAt: string;
  updatedAt: string;
}

export function getHabitStreak(taskId: string): HabitStreak | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM habit_streaks WHERE task_id = ?').get(taskId) as HabitStreak | undefined;
}

export function getAllHabitStreaks(): HabitStreak[] {
  const db = getDb();
  return db.prepare('SELECT * FROM habit_streaks ORDER BY current_streak DESC').all() as HabitStreak[];
}

export function createHabitStreak(taskId: string): HabitStreak {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO habit_streaks (id, task_id, current_streak, longest_streak, last_completed, streak_start, created_at, updated_at) VALUES (?, ?, 0, 0, NULL, NULL, ?, ?)'
  ).run(id, taskId, now, now);

  return db.prepare('SELECT * FROM habit_streaks WHERE id = ?').get(id) as HabitStreak;
}

export function updateHabitStreakOnComplete(taskId: string): HabitStreak {
  const db = getDb();
  const now = new Date().toISOString();
  const today = now.split('T')[0] ?? '';

  let streak = getHabitStreak(taskId);

  if (!streak) {
    streak = createHabitStreak(taskId);
  }

  const lastCompletedVal: string = streak.lastCompleted ?? '';
  const wasToday = lastCompletedVal.length > 0 && lastCompletedVal.startsWith(today);
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? '';
  const completedYesterday = lastCompletedVal.length > 0 && lastCompletedVal.startsWith(yesterday);

  if (wasToday) {
    // Already completed today, no change
    return streak;
  }

  let newCurrentStreak: number;
  let newStreakStart: string | null = streak.streakStart ?? today;

  if (completedYesterday) {
    // Continue streak
    newCurrentStreak = streak.currentStreak + 1;
  } else {
    // Reset streak
    newCurrentStreak = 1;
    newStreakStart = today;
  }

  const newLongestStreak = Math.max(newCurrentStreak, streak.longestStreak);

  db.prepare(
    'UPDATE habit_streaks SET current_streak = ?, longest_streak = ?, last_completed = ?, streak_start = ?, updated_at = ? WHERE task_id = ?'
  ).run(newCurrentStreak, newLongestStreak, today, newStreakStart, now, taskId);

  return db.prepare('SELECT * FROM habit_streaks WHERE id = ?').get(streak.id) as HabitStreak;
}

export function resetHabitStreak(taskId: string): void {
  const db = getDb();
  const streak = getHabitStreak(taskId);
  if (streak) {
    db.prepare('UPDATE habit_streaks SET current_streak = 0, streak_start = NULL WHERE id = ?').run(streak.id);
  }
}

// === User Operations ===

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  createdAt: string;
}

export function getUserById(id: string): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function getUserByEmail(email: string): User | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
}

export function createUser(data: { name: string; email: string; password?: string; avatar?: string }): User {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO users (id, name, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, data.name, data.email, data.password || null, data.avatar || null, now);

  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
}

export function updateUser(id: string, data: Partial<{ name: string; email: string; password: string; avatar: string }>): User {
  const db = getDb();
  const now = new Date().toISOString();
  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.email !== undefined) { updates.push('email = ?'); values.push(data.email); }
  if (data.password !== undefined) { updates.push('password = ?'); values.push(data.password); }
  if (data.avatar !== undefined) { updates.push('avatar = ?'); values.push(data.avatar); }
  updates.push('updated_at = ?'); values.push(now);
  values.push(id);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User;
}

export function deleteUser(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// === MFA Operations ===

export interface MfaSecret {
  id: string;
  userId: string;
  secret: string;
  createdAt: string;
  updatedAt: string;
}

export function getMfaSecret(userId: string): MfaSecret | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM mfa_secrets WHERE user_id = ?').get(userId) as MfaSecret | undefined;
}

export function createMfaSecret(userId: string, secret: string): MfaSecret {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO mfa_secrets (id, user_id, secret, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, secret, now, now);

  return db.prepare('SELECT * FROM mfa_secrets WHERE id = ?').get(id) as MfaSecret;
}

export function deleteMfaSecret(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM mfa_secrets WHERE user_id = ?').run(userId);
}

export function verifyTotp(secret: string, token: string): boolean {
  // This is a simplified version - in production use speakeasy or similar
  const crypto = require('crypto');
  const time = Math.floor(Date.now() / 1000 / 30);

  for (let i = -1; i <= 1; i++) {
    const counter = time + i;
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(0, 0);
    buffer.writeUInt32BE(counter, 4);

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const hash = hmac.digest();

    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24 |
                  (hash[offset + 1] & 0xff) << 16 |
                  (hash[offset + 2] & 0xff) << 8 |
                  (hash[offset + 3] & 0xff)) % 1000000;

    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }

  return false;
}

// === Session Operations ===

export interface Session {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export function createSession(data: { userId: string; ipAddress?: string; userAgent?: string }): Session {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, data.userId, data.ipAddress || null, data.userAgent || null, expiresAt, now);

  return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session;
}

export function getSession(id: string): Session | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
    .get(id, new Date().toISOString()) as Session | undefined;
}

export function deleteSession(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
}

export function deleteAllUserSessions(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

// === Refresh Token Operations ===

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

export function createRefreshToken(userId: string): RefreshToken {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, token, expiresAt, now);

  return db.prepare('SELECT * FROM refresh_tokens WHERE id = ?').get(id) as RefreshToken;
}

export function getRefreshToken(token: string): RefreshToken | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > ?')
    .get(token, new Date().toISOString()) as RefreshToken | undefined;
}

export function deleteRefreshToken(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(id);
}

// === Password Reset Token Operations ===

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

export function createPasswordResetToken(userId: string): PasswordResetToken {
  const db = getDb();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used, created_at) VALUES (?, ?, ?, ?, 0, ?)'
  ).run(id, userId, token, expiresAt, now);

  return db.prepare('SELECT * FROM password_reset_tokens WHERE id = ?').get(id) as PasswordResetToken;
}

export function getPasswordResetToken(token: string): PasswordResetToken | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM password_reset_tokens WHERE token = ?')
    .get(token) as PasswordResetToken | undefined;
}

export function markPasswordResetTokenUsed(id: string): void {
  const db = getDb();
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(id);
}

// === Theme Operations ===

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>;
  emoji: string;
  isCustom: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export function createTheme(data: { name: string; colors: Record<string, string>; emoji?: string; createdBy?: string }): Theme {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO themes (id, name, colors, emoji, is_custom, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)'
  ).run(id, data.name, JSON.stringify(data.colors), data.emoji || '🎨', data.createdBy || null, now, now);

  return db.prepare('SELECT * FROM themes WHERE id = ?').get(id) as Theme;
}

export function getThemes(): Theme[] {
  const db = getDb();
  return db.prepare('SELECT * FROM themes ORDER BY created_at DESC').all() as Theme[];
}

export function getThemeById(id: string): Theme | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM themes WHERE id = ?').get(id) as Theme | undefined;
}

// === Goal Operations ===

import type { Goal } from '../src/types/index.js';

export function getAllGoals(): Goal[] {
  const db = getDb();
  return db.prepare('SELECT * FROM goals ORDER BY created_at DESC').all() as Goal[];
}

export function getGoalsByPeriod(period: 'daily' | 'weekly' | 'monthly' | 'yearly'): Goal[] {
  const db = getDb();
  return db.prepare('SELECT * FROM goals WHERE period = ? ORDER BY created_at DESC').all(period) as Goal[];
}

export function getGoalById(id: string): Goal | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal | undefined;
}

export function createGoal(data: {
  userId: string;
  title: string;
  description?: string;
  targetValue: number;
  unit?: string;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  color?: string;
  startDate: string;
  endDate: string;
}): Goal {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO goals (id, user_id, title, description, target_value, unit, period, category, color, current_value, is_completed, start_date, end_date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`
  ).run(
    id,
    data.userId,
    data.title,
    data.description || '',
    data.targetValue,
    data.unit || 'tasks',
    data.period || 'weekly',
    data.category || 'general',
    data.color || '#3b82f6',
    data.startDate,
    data.endDate,
    now,
    now
  );

  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal;
}

export function updateGoalProgress(id: string, increment: number): Goal {
  const db = getDb();
  const goal = getGoalById(id);
  if (!goal) throw new Error('Goal not found');

  const newValue = Math.min(Math.max(goal.currentValue + increment, 0), goal.targetValue);
  const now = new Date().toISOString();
  const isCompleted = newValue >= goal.targetValue;

  db.prepare(
    'UPDATE goals SET current_value = ?, is_completed = ?, updated_at = ? WHERE id = ?'
  ).run(newValue, isCompleted ? 1 : 0, now, id);

  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal;
}

export function updateGoal(id: string, data: Partial<{
  title: string;
  description: string;
  targetValue: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  color: string;
  startDate: string;
  endDate: string;
}>): Goal {
  const db = getDb();
  const now = new Date().toISOString();
  const goal = getGoalById(id);
  if (!goal) throw new Error('Goal not found');

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.targetValue !== undefined) { updates.push('target_value = ?'); values.push(data.targetValue); }
  if (data.unit !== undefined) { updates.push('unit = ?'); values.push(data.unit); }
  if (data.period !== undefined) { updates.push('period = ?'); values.push(data.period); }
  if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.startDate !== undefined) { updates.push('start_date = ?'); values.push(data.startDate); }
  if (data.endDate !== undefined) { updates.push('end_date = ?'); values.push(data.endDate); }
  updates.push('updated_at = ?'); values.push(now);
  values.push(id);

  db.prepare(`UPDATE goals SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal;
}

export function deleteGoal(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
}

export function getActiveGoalsByPeriod(period: 'daily' | 'weekly' | 'monthly' | 'yearly', userId?: string): Goal[] {
  const db = getDb();
  const now = new Date().toISOString().split('T')[0];
  if (!now) return [];

  let query = 'SELECT * FROM goals WHERE period = ? AND start_date <= ? AND end_date >= ?';
  const values: (string | number)[] = [period, now, now];

  if (userId) {
    query += ' AND user_id = ?';
    values.push(userId);
  }

  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...values) as Goal[];
}

export function getGoalProgress(id: string): { current: number; target: number; percentage: number; isCompleted: boolean } {
  const goal = getGoalById(id);
  if (!goal) throw new Error('Goal not found');

  const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  return {
    current: goal.currentValue,
    target: goal.targetValue,
    percentage,
    isCompleted: Boolean(goal.isCompleted),
  };
}

// === Template Marketplace Operations ===

import type { TaskTemplate } from '../src/types/index.js';

interface TemplateRating {
  id: string;
  templateId: string;
  rating: number;
  createdAt: string;
}

export function getTemplates(category?: string | undefined, sortBy: string = 'usage_count', limit: number = 20): TaskTemplate[] {
  const db = getDb();
  let query = 'SELECT * FROM task_templates WHERE 1=1';
  const values: (string | number)[] = [];

  if (category) {
    query += ' AND category = ?';
    values.push(category);
  }

  // Sanitize sortBy to prevent SQL injection
  const validSortColumns = ['usage_count', 'avg_rating', 'created_at', 'name'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'usage_count';
  query += ` ORDER BY ${sortColumn} DESC LIMIT ?`;
  values.push(limit);

  return db.prepare(query).all(...values) as TaskTemplate[];
}

export function getTemplateRatings(templateId: string): TemplateRating[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM template_ratings WHERE template_id = ? ORDER BY created_at DESC'
  ).all(templateId) as TemplateRating[];
}

export function rateTemplate(templateId: string, rating: number): TemplateRating {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO template_ratings (id, template_id, rating, created_at) VALUES (?, ?, ?, ?)'
  ).run(id, templateId, rating, now);

  // Update usage count
  db.prepare(
    'UPDATE task_templates SET usage_count = usage_count + 1 WHERE id = ?'
  ).run(templateId);

  return db.prepare('SELECT * FROM template_ratings WHERE id = ?').get(id) as TemplateRating;
}

export function getTemplateById(id: string): TaskTemplate | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TaskTemplate | undefined;
}

export function createTemplate(data: {
  name: string;
  icon?: string;
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  estimateHours?: number;
  estimateMinutes?: number;
  isAllDay?: boolean;
  recurringType?: string;
  labelIds?: string[];
  category?: string;
  createdBy?: string;
}): TaskTemplate {
  const db = getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO task_templates
    (id, name, icon, title, description, priority, estimate_hours, estimate_minutes,
     is_all_day, recurring_type, recurring_interval, label_ids, category, created_by,
     created_at, updated_at, usage_count, avg_rating)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)
  `).run(
    id, data.name, data.icon || '📋', data.title, data.description || '',
    data.priority || 'none', data.estimateHours || 0, data.estimateMinutes || 0,
    data.isAllDay ? 1 : 0, data.recurringType || 'none', '',
    JSON.stringify(data.labelIds || []), data.category || 'general',
    data.createdBy || null, now, now
  );

  return db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TaskTemplate;
}

// === Custom Fields Operations ===

import type { CustomField } from '../src/types/index.js';

export interface CustomFieldData {
  id?: string;
  taskId: string;
  fieldKey: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  fieldValue?: string;
  label: string;
}

export function getCustomFields(taskId: string): CustomField[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM custom_fields WHERE task_id = ? ORDER BY field_key'
  ).all(taskId) as CustomField[];
}

export function createCustomField(data: CustomFieldData): CustomField {
  const db = getDb();
  const id = data.id || crypto.randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO custom_fields (id, task_id, field_key, field_type, field_value, label, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, data.taskId, data.fieldKey, data.fieldType, data.fieldValue || '', data.label, now);

  return db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id) as CustomField;
}

export function updateCustomField(id: string, fieldValue: string): CustomField {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(
    'UPDATE custom_fields SET field_value = ?, updated_at = ? WHERE id = ?'
  ).run(fieldValue, now, id);

  return db.prepare('SELECT * FROM custom_fields WHERE id = ?').get(id) as CustomField;
}

export function deleteCustomField(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM custom_fields WHERE id = ?').run(id);
}