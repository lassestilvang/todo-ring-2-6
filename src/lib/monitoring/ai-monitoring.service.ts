import { getDb } from '../../db/index';
import type { AIInteraction, UserFeedback, AIPerformanceMetrics } from '@/types/monitoring';

export class AIMonitoringService {
  private db = getDb();

  /**
   * Log an AI interaction
   */
  async logAIInteraction(data: AIInteraction) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      this.db.prepare(`
        INSERT INTO ai_interactions (
          id, user_id, prompt, action, confidence, response_time_ms,
          success, error_message, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.userId,
        data.prompt,
        data.action,
        data.confidence,
        data.responseTimeMs,
        data.success ? 1 : 0,
        data.errorMessage || null,
        now
      );

      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log user feedback for an AI interaction
   */
  async logUserFeedback(data: UserFeedback) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
      this.db.prepare(`
        INSERT INTO ai_feedback (
          id, interaction_id, user_id, rating, feedback_text,
          was_helpful, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        data.interactionId,
        data.userId,
        data.rating,
        data.feedbackText || null,
        data.wasHelpful ? 1 : 0,
        now
      );

      // Update the interaction with feedback flag
      this.db.prepare(`
        UPDATE ai_interactions
        SET has_feedback = 1
        WHERE id = ?
      `).run(data.interactionId);

      return { success: true, id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get performance metrics for AI interactions
   */
  async getPerformanceMetrics(options: { userId?: string; days?: number } = {}) {
    const db = this.db;
    const userId = options.userId;
    const days = options.days || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const baseQuery = `
      FROM ai_interactions
      WHERE created_at >= ?
    `;
    const params = [sinceDate];

    if (userId) {
      const userFilter = ' AND user_id = ?';
      return db.prepare(`
        SELECT
          COUNT(*) as total_interactions,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_interactions,
          AVG(CASE WHEN success = 1 THEN confidence END) as avg_confidence,
          AVG(response_time_ms) as avg_response_time,
          COUNT(CASE WHEN action = 'create_task' THEN 1 END) as creation_count,
          COUNT(CASE WHEN action = 'view_tasks' THEN 1 END) as view_count,
          COUNT(CASE WHEN action = 'set_priority' THEN 1 END) as priority_count,
          COUNT(CASE WHEN action = 'complete_task' THEN 1 END) as completion_count,
          COUNT(CASE WHEN action = 'suggest' THEN 1 END) as suggestion_count
        ${baseQuery}
      `).all(...params, userId)[0];
    }

    return db.prepare(`
      SELECT
        COUNT(*) as total_interactions,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_interactions,
        AVG(CASE WHEN success = 1 THEN confidence END) as avg_confidence,
        AVG(response_time_ms) as avg_response_time,
        COUNT(CASE WHEN action = 'create_task' THEN 1 END) as creation_count,
        COUNT(CASE WHEN action = 'view_tasks' THEN 1 END) as view_count,
        COUNT(CASE WHEN action = 'set_priority' THEN 1 END) as priority_count,
        COUNT(CASE WHEN action = 'complete_task' THEN 1 END) as completion_count,
        COUNT(CASE WHEN action = 'suggest' THEN 1 END) as suggestion_count
      ${baseQuery}
    `).all(...params)[0];
  }

  /**
   * Get feedback statistics
   */
  async getFeedbackStats(options: { userId?: string; days?: number } = {}) {
    const db = this.db;
    const userId = options.userId;
    const days = options.days || 30;
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const baseQuery = `
      FROM ai_feedback f
      JOIN ai_interactions i ON f.interaction_id = i.id
      WHERE i.created_at >= ?
    `;
    const params = [sinceDate];

    if (userId) {
      const userFilter = ' AND i.user_id = ?';
      return db.prepare(`
        SELECT
          COUNT(*) as total_feedback,
          AVG(rating) as avg_rating,
          SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpful_count,
          AVG(CASE WHEN was_helpful = 1 THEN rating END) as avg_helpful_rating
        ${baseQuery}
      `).all(...params, userId)[0];
    }

    return db.prepare(`
      SELECT
        COUNT(*) as total_feedback,
        AVG(rating) as avg_rating,
        SUM(CASE WHEN was_helpful = 1 THEN 1 ELSE 0 END) as helpful_count,
        AVG(CASE WHEN was_helpful = 1 THEN rating END) as avg_helpful_rating
      ${baseQuery}
    `).all(...params)[0];
  }
}

let aiMonitoringService: AIMonitoringService | null = null;

export function getAIMonitoringService(): AIMonitoringService {
  if (!aiMonitoringService) {
    aiMonitoringService = new AIMonitoringService();
  }
  return aiMonitoringService;
}