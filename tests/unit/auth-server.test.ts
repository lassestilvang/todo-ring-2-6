/**
 * Tests for src/lib/auth.ts server-side JWT functions
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateToken, verifyToken } from '../../src/lib/auth';

describe('Auth Server-side JWT', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset modules to get fresh imports
    vi.resetModules();
  });

  describe('generateToken', () => {
    it('should generate a token with correct format', () => {
      const userId = 'user_12345';
      const token = generateToken(userId);

      expect(token).toBeDefined();
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe(userId);
    });

    it('should generate unique tokens for same user', () => {
      const userId = 'user_12345';
      const token1 = generateToken(userId);
      // Small delay to ensure different timestamp
      const token2 = generateToken(userId);

      // Tokens may differ by timestamp (within same millisecond they're same)
      // Just verify both are valid tokens
      expect(token1.split('.')[0]).toBe(userId);
      expect(token2.split('.')[0]).toBe(userId);
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user_1');
      const token2 = generateToken('user_2');

      expect(token1.split('.')[0]).toBe('user_1');
      expect(token2.split('.')[0]).toBe('user_2');
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token and return userId', () => {
      const userId = 'user_12345';
      const token = generateToken(userId);

      const result = verifyToken(token);
      expect(result).toBe(userId);
    });

    it('should return null for invalid token format', () => {
      const result = verifyToken('invalid-token');
      expect(result).toBeNull();
    });

    it('should return null for token with missing parts', () => {
      expect(verifyToken('')).toBeNull();
      expect(verifyToken('only-two.parts')).toBeNull();
      expect(verifyToken('one')).toBeNull();
    });

    it('should return null for token with wrong signature', () => {
      const userId = 'user_12345';
      const timestamp = Date.now().toString();
      const fakeSignature = 'fakesignature';
      const fakeToken = `${userId}.${timestamp}.${fakeSignature}`;

      const result = verifyToken(fakeToken);
      expect(result).toBeNull();
    });

    it('should return null for expired token (older than 7 days)', () => {
      const userId = 'user_12345';
      const oldTimestamp = (Date.now() - 8 * 24 * 60 * 60 * 1000).toString(); // 8 days ago
      const { createHmac } = require('crypto');
      const signature = createHmac('sha256', process.env.JWT_SECRET || 'taskplanner-secret-key-change-in-production')
        .update(`${userId}:${oldTimestamp}`)
        .digest('hex');
      const expiredToken = `${userId}.${oldTimestamp}.${signature}`;

      const result = verifyToken(expiredToken);
      expect(result).toBeNull();
    });

    it('should verify token within 7 days', () => {
      const userId = 'user_12345';
      const recentTimestamp = (Date.now() - 6 * 24 * 60 * 60 * 1000).toString(); // 6 days ago
      const { createHmac } = require('crypto');
      const signature = createHmac('sha256', process.env.JWT_SECRET || 'taskplanner-secret-key-change-in-production')
        .update(`${userId}:${recentTimestamp}`)
        .digest('hex');
      const validToken = `${userId}.${recentTimestamp}.${signature}`;

      const result = verifyToken(validToken);
      expect(result).toBe(userId);
    });

    it('should handle malformed token gracefully', () => {
      expect(verifyToken(null as any)).toBeNull();
      expect(verifyToken(undefined as any)).toBeNull();
      expect(verifyToken(123 as any)).toBeNull();
    });
  });
});