/**
 * Database Operations
 * Re-exports all database operations from the repository pattern.
 * This file provides backward compatibility with the legacy API.
 */

import { getDb } from './db-client';

// Generate UUID using crypto (Node 14+)
function generateUUID(): string {
  return crypto.randomUUID();
}

// Type imports
import type { Task, List, Label, Subtask, TaskTemplate, TemplateRating, Goal, User } from '../src/types/index';

// === Database Client ===
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

export function getInboxList(): List | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM lists WHERE is_inbox = 1').get() as List | undefined;
}

export function createList(data: { name: string; color?: string; emoji?: string }): List {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO lists (id, name, color, emoji, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, data.name, data.color || '#3b82f6', data.emoji || '📋', now, now);
  return getListById(id)!;
}

export function updateList(id: string, data: Partial<List>): List {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.emoji !== undefined) { updates.push('emoji = ?'); values.push(data.emoji); }

  values.push(id);
  db.prepare(`UPDATE lists SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`).run(
    ...values,
    new Date().toISOString(),
    id
  );
  return getListById(id)!;
}

export function deleteList(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM lists WHERE id = ?').run(id);
}

export function updateListSortOrder(id: string, sortOrder: number): void {
  const db = getDb();
  db.prepare('UPDATE lists SET sort_order = ?, updated_at = ? WHERE id = ?').run(
    sortOrder,
    new Date().toISOString(),
    id
  );
}

// === Task Operations ===
export function getTaskById(id: string): Task | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT t.*,
           COALESCE(
             (SELECT json_group_array(l.id || ':' || l.name || ':' || l.color || ':' || COALESCE(l.icon, ''))
              FROM task_labels tl JOIN labels l ON tl.label_id = l.id WHERE tl.task_id = t.id),
             '[]'
           ) as labels
    FROM tasks t WHERE t.id = ?
  `).get(id) as Task | undefined;
}

export function getTasks(limit?: number): Task[] {
  const db = getDb();
  const sql = limit ? 'SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?' : 'SELECT * FROM tasks ORDER BY created_at DESC';
  return db.prepare(sql).all(limit) as Task[];
}

export function getAllTasks(): Task[] {
  return getTasks();
}

export function getInboxTasks(): Task[] {
  const db = getDb();
  const inboxId = db.prepare('SELECT id FROM lists WHERE is_inbox = 1').get()?.id;
  if (!inboxId) return [];
  return db.prepare('SELECT * FROM tasks WHERE list_id = ? ORDER BY created_at DESC').all(inboxId) as Task[];
}

export function getTasksForToday(): Task[] {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare('SELECT * FROM tasks WHERE date = ? AND status NOT IN ("completed", "cancelled") ORDER BY priority DESC, created_at DESC').all(today) as Task[];
}

export function getTasksForNext7Days(): Task[] {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return db.prepare('SELECT * FROM tasks WHERE date BETWEEN ? AND ? AND status NOT IN ("completed", "cancelled") ORDER BY date ASC, priority DESC').all(today, nextWeek) as Task[];
}

export function getUpcomingTasks(): Task[] {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare('SELECT * FROM tasks WHERE date >= ? AND status NOT IN ("completed", "cancelled") ORDER BY date ASC, priority DESC LIMIT 20').all(today) as Task[];
}

export function createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Task {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    `INSERT INTO tasks (id, title, description, list_id, date, deadline, priority, status,
     recurring_type, recurring_interval, is_all_day, completed_at, sort_order, assignee_id, assignee_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    id, data.title, data.description || '', data.listId, data.date, data.deadline,
    data.priority || 'none', data.status || 'pending', data.recurringType || 'none',
    data.recurringInterval || '', data.isAllDay ? 1 : 0, data.completedAt,
    data.sortOrder || 0, data.assigneeId, data.assigneeName, now, now
  );
  return getTaskById(id)!;
}

export function updateTask(id: string, data: Partial<Task>): Task {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  const fields = ['title', 'description', 'listId', 'date', 'deadline', 'priority', 'status',
                  'recurringType', 'recurringInterval', 'isAllDay', 'completedAt', 'sortOrder', 'assigneeId', 'assigneeName'];

  for (const field of fields) {
    if (data[field as keyof Task] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field as keyof Task]);
    }
  }

  values.push(id);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`).run(
    ...values,
    new Date().toISOString(),
    id
  );
  return getTaskById(id)!;
}

export function deleteTask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}

export function toggleTaskStatus(id: string, status: Task['status']): Task {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?').run(
    status,
    status === 'completed' ? now : null,
    now,
    id
  );
  return getTaskById(id)!;
}

// === Template Operations ===
export function getTemplates(sortBy: 'usage_count' | 'avg_rating' | 'created_at' | 'name' = 'usage_count', limit: number = 20): TaskTemplate[] {
  const db = getDb();
  const validSortColumns = ['usage_count', 'avg_rating', 'created_at', 'name'];
  const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'usage_count';
  return db.prepare(`SELECT * FROM task_templates ORDER BY ${sortColumn} DESC LIMIT ?`).all(limit) as TaskTemplate[];
}

export function getTemplateRatings(templateId: string): TemplateRating[] {
  const db = getDb();
  return db.prepare('SELECT * FROM template_ratings WHERE template_id = ? ORDER BY created_at DESC').all(templateId) as TemplateRating[];
}

export function rateTemplate(templateId: string, rating: number, userId?: string): TemplateRating {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();

  db.prepare('INSERT INTO template_ratings (id, template_id, user_id, rating, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id, templateId, userId || null, rating, now
  );

  const stats = db.prepare('SELECT AVG(rating) as avg_rating FROM template_ratings WHERE template_id = ?').get(templateId) as { avg_rating: number };
  db.prepare('UPDATE task_templates SET avg_rating = ? WHERE id = ?').run(stats.avg_rating, templateId);
  db.prepare('UPDATE task_templates SET usage_count = usage_count + 1 WHERE id = ?').run(templateId);

  return db.prepare('SELECT * FROM template_ratings WHERE id = ?').get(id) as TemplateRating;
}

export function getTemplateById(id: string): TaskTemplate | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM task_templates WHERE id = ?').get(id) as TaskTemplate | undefined;
}

export function createTemplate(data: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'avgRating'>): TaskTemplate {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO task_templates (id, name, title, description, priority, estimate_hours, estimate_minutes, is_all_day, recurring_type, label_ids, category, created_by, created_at, updated_at, usage_count, avg_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)'
  );
  stmt.run(
    id, data.name, data.title, data.description || '', data.priority || 'none',
    data.estimateHours || 0, data.estimateMinutes || 0, data.isAllDay ? 1 : 0,
    data.recurringType || 'none', JSON.stringify(data.labelIds || []),
    data.category || 'general', data.createdBy || null, now, now
  );
  return getTemplateById(id)!;
}

// === Goal Operations ===
export function getAllGoals(): Goal[] {
  const db = getDb();
  return db.prepare('SELECT * FROM goals ORDER BY start_date DESC').all() as Goal[];
}

export function getGoalsByPeriod(period: string): Goal[] {
  const db = getDb();
  return db.prepare('SELECT * FROM goals WHERE period = ? ORDER BY start_date DESC').all(period) as Goal[];
}

export function getGoalById(id: string): Goal | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM goals WHERE id = ?').get(id) as Goal | undefined;
}

export function createGoal(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Goal {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'INSERT INTO goals (id, user_id, title, description, target_value, unit, period, category, color, current_value, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  stmt.run(
    id, data.userId, data.title, data.description || '', data.targetValue, data.unit,
    data.period, data.category || 'general', data.color || '#3b82f6', data.currentValue || 0,
    data.startDate, data.endDate, now, now
  );
  return getGoalById(id)!;
}

export function updateGoalProgress(id: string, progress: number): Goal {
  const db = getDb();
  db.prepare('UPDATE goals SET current_value = ?, updated_at = ? WHERE id = ?').run(
    progress, new Date().toISOString(), id
  );
  return getGoalById(id)!;
}

export function updateGoal(id: string, data: Partial<Goal>): Goal {
  const db = getDb();
  const updates: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.targetValue !== undefined) { updates.push('target_value = ?'); values.push(data.targetValue); }
  if (data.unit !== undefined) { updates.push('unit = ?'); values.push(data.unit); }
  if (data.period !== undefined) { updates.push('period = ?'); values.push(data.period); }
  if (data.category !== undefined) { updates.push('category = ?'); values.push(data.category); }
  if (data.color !== undefined) { updates.push('color = ?'); values.push(data.color); }
  if (data.currentValue !== undefined) { updates.push('current_value = ?'); values.push(data.currentValue); }
  if (data.startDate !== undefined) { updates.push('start_date = ?'); values.push(data.startDate); }
  if (data.endDate !== undefined) { updates.push('end_date = ?'); values.push(data.endDate); }

  values.push(id);
  db.prepare(`UPDATE goals SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`).run(
    ...values,
    new Date().toISOString(),
    id
  );
  return getGoalById(id)!;
}

export function deleteGoal(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
}

export function getActiveGoalsByPeriod(period: string): Goal[] {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM goals WHERE period = ? AND is_completed = 0 ORDER BY start_date DESC'
  ).all(period) as Goal[];
}

export function getGoalProgress(id: string): { current: number; target: number; percentage: number } {
  const db = getDb();
  const goal = db.prepare('SELECT current_value, target_value FROM goals WHERE id = ?').get(id) as Goal | undefined;
  if (!goal) return { current: 0, target: 0, percentage: 0 };
  return {
    current: goal.currentValue || 0,
    target: goal.targetValue || 0,
    percentage: goal.targetValue ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0,
  };
}

// === Recurring Task Operations ===
export function getRecurringTasks(): Task[] {
  const db = getDb();
  return db.prepare('SELECT * FROM tasks WHERE recurring_type != "none" ORDER BY created_at DESC').all() as Task[];
}

export function calculateNextDate(type: string, interval?: string): string {
  const now = new Date();
  switch (type) {
    case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'weekdays': return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case 'monthly': return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString().split('T')[0];
    case 'yearly': return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
    default: return now.toISOString().split('T')[0];
  }
}

export function expandRecurringTask(task: Task): Task {
  const db = getDb();
  const nextDate = calculateNextDate(task.recurringType || 'none', task.recurringInterval);
  return createTask({ ...task, date: nextDate, completedAt: undefined });
}

export function processRecurringTasks(): number {
  const db = getDb();
  const tasks = getRecurringTasks();
  let count = 0;

  for (const task of tasks) {
    const nextDate = calculateNextDate(task.recurringType || 'none', task.recurringInterval);
    if (nextDate <= new Date().toISOString().split('T')[0]) {
      createTask({ ...task, date: nextDate, completedAt: undefined });
      count++;
    }
  }
  return count;
}

export function getRecurringExceptions(taskId: string): string[] {
  const db = getDb();
  return db.prepare('SELECT exception_date FROM recurring_exceptions WHERE task_id = ?').all(taskId).map((r: any) => r.exception_date);
}

// === Task Dependency Operations ===
export function getTaskDependencies(taskId: string): Array<{ taskId: string; dependsOnId: string }> {
  const db = getDb();
  return db.prepare('SELECT task_id as taskId, depends_on_id as dependsOnId FROM task_dependencies WHERE task_id = ?').all(taskId);
}

export function getTaskDependents(taskId: string): Array<{ taskId: string; dependsOnId: string }> {
  const db = getDb();
  return db.prepare('SELECT task_id as taskId, depends_on_id as dependsOnId FROM task_dependencies WHERE depends_on_id = ?').all(taskId);
}

export function getBlockedTasks(taskId: string): Task[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.* FROM tasks t
    JOIN task_dependencies td ON t.id = td.task_id
    WHERE td.depends_on_id = ? AND t.status != 'completed'
  `).all(taskId) as Task[];
}

export function canCompleteTask(taskId: string): boolean {
  const db = getDb();
  const blocked = db.prepare(
    'SELECT COUNT(*) as count FROM task_dependencies WHERE task_id = ? AND depends_on_id IN (SELECT id FROM tasks WHERE status != "completed")'
  ).get(taskId) as { count: number };
  return blocked.count === 0;
}

// === Reminder Operations ===
export function getReminders(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM reminders WHERE task_id = ? ORDER BY remind_at ASC').all(taskId);
}

export function getUpcomingReminders(): any[] {
  const db = getDb();
  const now = new Date().toISOString();
  return db.prepare('SELECT * FROM reminders WHERE remind_at >= ? AND is_fired = 0 ORDER BY remind_at ASC').all(now);
}

export function updateReminder(id: string, data: Partial<any>): any {
  const db = getDb();
  const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  db.prepare(`UPDATE reminders SET ${updates}, updated_at = ? WHERE id = ?`).run(...values, new Date().toISOString(), id);
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id);
}

export function deleteReminder(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id);
}

// === Comment Operations ===
export function getTaskComments(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at DESC').all(taskId);
}

export function getCommentReplies(parentId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM task_comments WHERE parent_id = ? ORDER BY created_at ASC').all(parentId);
}

export function deleteTaskComment(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM task_comments WHERE id = ?').run(id);
}

// === Mention Operations ===
export function addCommentMention(commentId: string, userId: string, userName: string): any {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO comment_mentions (id, comment_id, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id, commentId, userId, userName, now
  );
  return { id, commentId, userId, userName };
}

export function getCommentMentions(userId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM comment_mentions WHERE user_id = ? AND is_notified = 0').all(userId);
}

export function markMentionAsNotified(id: string): void {
  const db = getDb();
  db.prepare('UPDATE comment_mentions SET is_notified = 1 WHERE id = ?').run(id);
}

// === Stats Operations ===
export function getOverdueCount(): number {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare('SELECT COUNT(*) as count FROM tasks WHERE date < ? AND status NOT IN ("completed", "cancelled")').get(today)?.count || 0;
}

export function getCompletedTodayCount(): number {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  return db.prepare("SELECT COUNT(*) as count FROM tasks WHERE DATE(completed_at) = ? AND status = 'completed'").get(today)?.count || 0;
}

export function getTaskStats(): { total: number; pending: number; completed: number; overdue: number } {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN date < ? AND status NOT IN ('completed', 'cancelled') THEN 1 ELSE 0 END) as overdue
    FROM tasks
  `).get(today) as any;
  return stats;
}

// === Habit Streak Operations ===
export function getHabitStreak(taskId: string): any {
  const db = getDb();
  return db.prepare('SELECT * FROM habit_streaks WHERE task_id = ?').get(taskId);
}

export function getAllHabitStreaks(): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM habit_streaks ORDER BY created_at DESC').all();
}

export function updateHabitStreakOnComplete(taskId: string): any {
  const db = getDb();
  const streak = db.prepare('SELECT * FROM habit_streaks WHERE task_id = ?').get(taskId) as any;
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  if (!streak) {
    return db.prepare(
      'INSERT INTO habit_streaks (id, task_id, current_streak, longest_streak, last_completed, created_at, updated_at) VALUES (?, ?, 1, 1, ?, ?, ?)'
    ).run(generateUUID(), taskId, now, now, new Date().toISOString());
  }

  const newStreak = streak.last_completed === today ? streak.current_streak : streak.current_streak + 1;
  const longestStreak = Math.max(newStreak, streak.longest_streak);

  return db.prepare(
    'UPDATE habit_streaks SET current_streak = ?, longest_streak = ?, last_completed = ?, updated_at = ? WHERE id = ?'
  ).run(newStreak, longestStreak, now, new Date().toISOString(), streak.id);
}

export function resetHabitStreak(taskId: string): void {
  const db = getDb();
  db.prepare('UPDATE habit_streaks SET current_streak = 0, streak_start = ? WHERE task_id = ?').run(
    new Date().toISOString(), taskId
  );
}

// === Refresh Token Operations ===
export function createRefreshToken(userId: string): any {
  const db = getDb();
  const id = generateUUID();
  const token = generateUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, token, expiresAt, now);

  return { id, userId, token, expiresAt, createdAt: now };
}

export function findRefreshToken(id: string): any {
  const db = getDb();
  return db.prepare('SELECT * FROM refresh_tokens WHERE id = ?').get(id);
}

export function findRefreshTokenByToken(token: string): any {
  const db = getDb();
  return db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(token);
}

export function deleteRefreshToken(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(id);
}

export function deleteRefreshTokenByToken(token: string): void {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

export function deleteRefreshTokensByUserId(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

export function deleteExpiredRefreshTokens(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(now);
}

// === Subtask Operations ===
export function getSubtasks(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM subtasks WHERE task_id = ? ORDER BY sort_order ASC').all(taskId);
}

export function createSubtask(taskId: string, title: string): any {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO subtasks (id, task_id, title, is_completed, sort_order, created_at) VALUES (?, ?, ?, 0, 0, ?)').run(id, taskId, title, now);
  return { id, taskId, title, isCompleted: false, sortOrder: 0, createdAt: now };
}

export function toggleSubtask(id: string): any {
  const db = getDb();
  const subtask = db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
  if (!subtask) return null;
  db.prepare('UPDATE subtasks SET is_completed = NOT is_completed, updated_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  return db.prepare('SELECT * FROM subtasks WHERE id = ?').get(id);
}

export function deleteSubtask(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM subtasks WHERE id = ?').run(id);
}

export function updateTaskSortOrder(id: string, sortOrder: number): void {
  const db = getDb();
  db.prepare('UPDATE tasks SET sort_order = ?, updated_at = ? WHERE id = ?').run(sortOrder, new Date().toISOString(), id);
}

// === Label Operations ===
export function getAllLabels(): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM labels ORDER BY name ASC').all();
}

export function getLabelById(id: string): any {
  const db = getDb();
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id);
}

export function createLabel(name: string, color: string, icon: string = '🏷'): any {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO labels (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)').run(id, name, color, icon, now);
  return { id, name, color, icon, createdAt: now };
}

export function deleteLabel(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM labels WHERE id = ?').run(id);
}

export function updateLabel(id: string, data: Partial<any>): any {
  const db = getDb();
  const updates = Object.entries(data).map(([k]) => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  db.prepare(`UPDATE labels SET ${updates}, updated_at = ? WHERE id = ?`).run(...values, new Date().toISOString(), id);
  return db.prepare('SELECT * FROM labels WHERE id = ?').get(id);
}

// === Task-Label Operations ===
export function getTaskLabels(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT label_id FROM task_labels WHERE task_id = ?').all(taskId).map((r: any) => r.label_id);
}

export function getTasksByLabel(labelId: string): Task[] {
  const db = getDb();
  return db.prepare(`
    SELECT t.* FROM tasks t
    JOIN task_labels tl ON t.id = tl.task_id
    WHERE tl.label_id = ?
  `).all(labelId) as Task[];
}

export function getTasksByLabels(labelIds: string[]): Task[] {
  const db = getDb();
  const placeholders = labelIds.map(() => '?').join(',');
  return db.prepare(`
    SELECT t.* FROM tasks t
    JOIN task_labels tl ON t.id = tl.task_id
    WHERE tl.label_id IN (${placeholders})
  `).all(...labelIds) as Task[];
}

export function addLabelToTask(taskId: string, labelId: string): void {
  const db = getDb();
  const id = generateUUID();
  db.prepare('INSERT OR IGNORE INTO task_labels (id, task_id, label_id) VALUES (?, ?, ?)').run(id, taskId, labelId);
}

export function removeLabelFromTask(taskId: string, labelId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM task_labels WHERE task_id = ? AND label_id = ?').run(taskId, labelId);
}

// === Task History Operations ===
export function addTaskHistory(taskId: string, action: string, fieldChanged?: string, oldValue?: string, newValue?: string): any {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO task_history (id, task_id, action, field_changed, old_value, new_value, performed_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, taskId, action, fieldChanged, oldValue, newValue, now);
  return { id, taskId, action, fieldChanged, oldValue, newValue, performedAt: now };
}

export function getTaskHistory(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM task_history WHERE task_id = ? ORDER BY performed_at DESC').all(taskId);
}

// === Attachment Operations ===
export function getAttachments(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM attachments WHERE task_id = ? ORDER BY created_at DESC').all(taskId);
}

export function createAttachment(taskId: string, filename: string, fileType?: string, fileSize?: number, filePath?: string): any {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO attachments (id, task_id, filename, file_type, file_size, file_path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, taskId, filename, fileType, fileSize, filePath, now);
  return { id, taskId, filename, fileType, fileSize, filePath, createdAt: now };
}

export function deleteAttachment(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
}

// === Comment Operations ===
export function getTaskComments(taskId: string): any[] {
  const db = getDb();
  return db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at DESC').all(taskId);
}

export function createTaskComment(taskId: string, userId: string, userName: string, content: string): any {
  const db = getDb();
  const id = generateUUID();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO task_comments (id, task_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(id, taskId, userId, userName, content, now);
  return { id, taskId, userId, userName, content, createdAt: now };
}