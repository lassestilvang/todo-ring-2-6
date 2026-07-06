import { BaseRepository } from './base-repository';
import type { TaskComment } from '../../src/types/index';

export class CommentRepository extends BaseRepository<TaskComment> {
  constructor() {
    super('task_comments', { timestamps: true });
  }

  getByTaskId(taskId: string): TaskComment[] {
    return this.db.prepare(
      'SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at DESC'
    ).all(taskId) as TaskComment[];
  }

  getReplies(parentId: string): TaskComment[] {
    return this.db.prepare(
      'SELECT * FROM task_comments WHERE parent_id = ? ORDER BY created_at ASC'
    ).all(parentId) as TaskComment[];
  }

  addMention(commentId: string, userId: string, userName: string): void {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    this.db.prepare(
      'INSERT INTO comment_mentions (id, comment_id, user_id, user_name, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, commentId, userId, userName, now);
  }
}

export function getCommentRepository(): CommentRepository {
  return new CommentRepository();
}
