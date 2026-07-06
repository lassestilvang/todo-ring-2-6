import { BaseRepository } from './base-repository';
import type { CommentMention } from '../../src/types/index';

export class CommentMentionRepository extends BaseRepository<CommentMention> {
  constructor() {
    super('comment_mentions');
  }

  getByUserId(userId: string): CommentMention[] {
    return this.db.prepare(
      'SELECT * FROM comment_mentions WHERE user_id = ? AND is_notified = 0'
    ).all(userId) as CommentMention[];
  }

  markAsNotified(id: string): void {
    this.db.prepare('UPDATE comment_mentions SET is_notified = 1 WHERE id = ?').run(id);
  }
}

export function getCommentMentionRepository(): CommentMentionRepository {
  return new CommentMentionRepository();
}
