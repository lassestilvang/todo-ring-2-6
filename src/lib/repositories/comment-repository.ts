/**
 * Comment Repository
 * Handles all database operations related to task comments
 */

import { getDb } from '../../db/index';
import type { TaskComment } from '@/types/index';

export class CommentRepository {
  private db = getDb();

  findByTaskId(taskId: string, includeReplies: boolean = true): TaskComment[] {
    const comments = this.db.prepare(
      'SELECT * FROM task_comments WHERE task_id = ? AND parent_id IS NULL ORDER BY created_at ASC'
    ).all(taskId) as TaskComment[];

    if (!includeReplies) return comments;

    const commentIds = comments.map(c => c.id);
    if (commentIds.length === 0) return [];

    const placeholders = commentIds.map(() => '?').join(',');
    const replies = this.db.prepare(
      `SELECT * FROM task_comments WHERE parent_id IN (${placeholders}) ORDER BY created_at ASC`
    ).all(...commentIds) as TaskComment[];

    const commentMap = new Map<string, TaskComment[]>();
    for (const reply of replies) {
      if (!commentMap.has(reply.parentId || '')) {
        commentMap.set(reply.parentId || '', []);
      }
      commentMap.get(reply.parentId || '')!.push(reply);
    }

    for (const comment of comments) {
      (comment as any).replies = commentMap.get(comment.id) || [];
    }

    return comments;
  }

  findById(id: string): TaskComment | undefined {
    return this.db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id) as TaskComment | undefined;
  }

  create(data: {
    taskId: string;
    userId: string;
    userName: string;
    content: string;
    parentId?: string;
  }): TaskComment {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO task_comments (id, task_id, parent_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(id, data.taskId, data.parentId || null, data.userId, data.userName, data.content, now);

    return this.findById(id)!;
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM task_comments WHERE id = ?').run(id);
  }

  deleteByTask(taskId: string): void {
    this.db.prepare('DELETE FROM task_comments WHERE task_id = ?').run(taskId);
  }

  getReplies(parentId: string): TaskComment[] {
    return this.db.prepare(
      'SELECT * FROM task_comments WHERE parent_id = ? ORDER BY created_at ASC'
    ).all(parentId) as TaskComment[];
  }
}

let commentRepository: CommentRepository | null = null;

export function getCommentRepository(): CommentRepository {
  if (!commentRepository) {
    commentRepository = new CommentRepository();
  }
  return commentRepository;
}