import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAIMonitoringService } from '@/lib/monitoring/ai-monitoring.service';

describe('AIMonitoringService', () => {
  let mockDb: any;
  let monitoringService: any;

  beforeEach(() => {
    // Mock database
    mockDb = {
      prepare: vi.fn().mockReturnThis(),
      run: vi.fn(),
      all: vi.fn()
    };

    // Mock getDb to return our mock
    vi.mock('@/db/db-client', () => ({
      getDb: () => mockDb
    }));

    monitoringService = getAIMonitoringService();
  });

  it('should log AI interaction successfully', async () => {
    // Arrange
    const mockResult = { lastInsertRowid: 1 };
    mockDb.run.mockReturnValue(mockResult);

    const interactionData = {
      userId: 'user-123',
      prompt: 'Create a task',
      action: 'create_task',
      confidence: 0.85,
      responseTimeMs: 150,
      success: true
    };

    // Act
    const result = await monitoringService.logAIInteraction(interactionData);

    // Assert
    expect(result.success).toBe(true);
    expect(mockDb.prepare).toHaveBeenCalled();
    expect(mockDb.run).toHaveBeenCalled();
  });

  it('should handle database errors when logging interaction', async () => {
    // Arrange
    mockDb.prepare.mockImplementation(() => {
      throw new Error('Database error');
    });

    const interactionData = {
      userId: 'user-123',
      prompt: 'Test',
      action: 'test',
      confidence: 0.5,
      responseTimeMs: 100,
      success: true
    };

    // Act
    const result = await monitoringService.logAIInteraction(interactionData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });

  it('should log user feedback successfully', async () => {
    // Arrange
    const mockResult = { lastInsertRowid: 1 };
    mockDb.run.mockReturnValue(mockResult);

    const feedbackData = {
      interactionId: 'interaction-123',
      userId: 'user-123',
      rating: 5,
      feedbackText: 'Very helpful!',
      wasHelpful: true
    };

    // Act
    const result = await monitoringService.logUserFeedback(feedbackData);

    // Assert
    expect(result.success).toBe(true);
    expect(mockDb.prepare).toHaveBeenCalled();
    expect(mockDb.run).toHaveBeenCalledTimes(2); // One for insert, one for update
  });

  it('should get performance metrics', async () => {
    // Arrange
    const mockMetrics = [{
      total_interactions: 10,
      successful_interactions: 8,
      avg_confidence: 0.75,
      avg_response_time: 200
    }];
    mockDb.all.mockReturnValue(mockMetrics);

    // Act
    const result = await monitoringService.getPerformanceMetrics({ userId: 'user-123' });

    // Assert
    expect(result.total_interactions).toBe(10);
    expect(mockDb.all).toHaveBeenCalled();
  });

  it('should handle edge cases in metrics calculation', async () => {
    // Arrange
    mockDb.all.mockReturnValue([{}]);
    const emptyResult = await monitoringService.getPerformanceMetrics();

    // Assert
    expect(emptyResult).toBeDefined();
  });
});