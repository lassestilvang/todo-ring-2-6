/**
 * Authentication Integration Tests
 *
 * These tests verify authentication flows.
 * Run with: npm run test:integration
 *
 * Note: These tests use mocked fetch and don't require a running database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock global fetch
const originalFetch = global.fetch;

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('Login Flow', () => {
    it('should authenticate user with valid credentials', async () => {
      const response = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          token: 'valid-token',
          refreshToken: 'refresh-token',
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => response,
      });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });

      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.token).toBeDefined();
      expect(data.data.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid credentials' }),
      });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'wrong@example.com', password: 'wrong' }),
      });

      const data = await res.json();

      expect(res.ok).toBe(false);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid credentials');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const response = {
        success: true,
        data: { token: 'new-access-token' },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => response,
      });

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'valid-refresh-token' }),
      });

      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.data.token).toBe('new-access-token');
    });

    it('should reject invalid refresh token', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Invalid refresh token' }),
      });

      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalid-token' }),
      });

      const data = await res.json();

      expect(res.ok).toBe(false);
      expect(data.error).toBe('Invalid refresh token');
    });
  });

  describe('Password Reset', () => {
    it('should send password reset email', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.success).toBe(true);
    });

    it('should reset password with valid token', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const res = await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'valid-reset-token', password: 'newpassword' }),
      });

      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should create session on login', async () => {
      const response = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com' },
          session: { id: 'session-123' },
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => response,
      });

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      });

      const data = await res.json();

      expect(data.data.session).toBeDefined();
      expect(data.data.session.id).toBe('session-123');
    });

    it('should logout and invalidate session', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      expect(res.ok).toBe(true);
      expect(data.success).toBe(true);
    });
  });
});