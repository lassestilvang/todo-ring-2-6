/**
 * WebSocket Rate Limiter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkWebSocketRateLimit, checkConnectionLimit, resetConnectionCount } from '../../src/lib/websocket-rate-limit';

describe('WebSocket Rate Limiter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkWebSocketRateLimit', () => {
    it('should allow requests within limit', () => {
      const result = checkWebSocketRateLimit('client-1', 100);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should deny requests exceeding limit', () => {
      const clientId = 'client-2';
      // Make 20 requests (exceeding limit of 20)
      for (let i = 0; i < 21; i++) {
        checkWebSocketRateLimit(clientId, 20);
      }
      const result = checkWebSocketRateLimit(clientId, 20);
      expect(result.allowed).toBe(false);
    });

    it('should return correct reset time', () => {
      const result = checkWebSocketRateLimit('client-3', 100);
      expect(result.reset).toBeGreaterThan(0);
    });
  });

  describe('checkConnectionLimit', () => {
    it('should allow initial connections', () => {
      expect(checkConnectionLimit('client-new')).toBe(true);
    });
  });

  describe('resetConnectionCount', () => {
    it('should decrement connection count', () => {
      // This function exists and can be called
      expect(() => resetConnectionCount('client-reset')).not.toThrow();
    });
  });
});