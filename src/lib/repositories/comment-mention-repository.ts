/**
 * Comment Mention Repository
 * Handles all database operations related to comment mentions
 */

import { getDb } from '../../db/index';
import type { CommentMention } from '@/types/index';

export class CommentMentionRepository {
  private db = getDb();

  findByCommentId(commentId: string): CommentMention[] {
    return this.db.prepare(
      'SELECT * FROM comment_mentions WHERE comment_id = ? ORDER BY created_at DESC'
    ).all(commentId) as CommentMention[];
  }

  findById(id: string): CommentMention | undefined {
    return this.db.prepare('SELECT * FROM comment_mentions WHERE id = ?').get(id) as CommentMention | undefined;
  }

  findByUserId(userId: string): CommentMention[] {
    return this.db.prepare(
      'SELECT * FROM comment_mentions WHERE user_id = ? AND is_notified = 0 ORDER BY created_at DESC'
    ).all(userId) as CommentMention[];
  }

  create(data: {
    commentId: string;
    userId: string;
    userName: string;
  }): CommentMention {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO comment_mentions (id, comment_id, user_id, user_name, is_notified, created_at) VALUES (?, ?, ?, ?, 0, ?)'
    ).run(id, data.commentId, data.userId, data.userName, now);

    return this.findById(id)!;
  }

  markAsNotified(id: string): void {
    this.db.prepare('UPDATE comment_mentions SET is_notified = 1 WHERE id = ?').run(id);
  }

  markAllAsNotified(userId: string): void {
    this.db.prepare('UPDATE comment_mentions SET is_notified = 1 WHERE user_id = ?').run(userId);
  }

  deleteByCommentId(commentId: string): void {
    this.db.prepare('DELETE FROM comment_mentions WHERE comment_id = ?').run(commentId);
  }
}

let commentMentionRepository: CommentMentionRepository | null = null;

export function getCommentMentionRepository(): CommentMentionRepository {
  if (!commentMentionRepository) {
    commentMentionRepository = new CommentMentionRepository();
  }
  return commentMentionRepository;
}