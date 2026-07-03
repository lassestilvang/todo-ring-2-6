/**
 * Saved View Repository
 * Provides CRUD operations for saved views
 */

import { BaseRepository } from './base-repository';
import type { SavedView } from '@/types/index';

export class SavedViewRepository extends BaseRepository<SavedView> {
  constructor() {
    super('saved_views', { timestamps: true });
  }

  /**
   * Find all saved views for a user
   */
  findByUserId(userId: string): SavedView[] {
    return this.query('SELECT * FROM saved_views WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  }

  /**
   * Find a single saved view by ID
   */
  findById(id: string): SavedView | undefined {
    return super.findById(id);
  }

  /**
   * Create a new saved view
   */
  create(data: Omit<SavedView, 'id' | 'createdAt' | 'updatedAt'> & Record<string, any>): SavedView {
    return super.create(data);
  }

  /**
   * Update a saved view
   */
  update(id: string, data: Partial<Omit<SavedView, 'id'>> & Record<string, any>): SavedView {
    return super.update(id, data);
  }

  /**
   * Delete a saved view
   */
  delete(id: string): boolean {
    return super.delete(id);
  }
}

let savedViewRepository: SavedViewRepository | null = null;

export function getSavedViewRepository(): SavedViewRepository {
  if (!savedViewRepository) {
    savedViewRepository = new SavedViewRepository();
  }
  return savedViewRepository;
}