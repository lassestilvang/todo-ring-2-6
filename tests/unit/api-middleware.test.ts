/**
 * Tests for src/lib/api-middleware.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Mock rate-limiter
vi.mock('../../src/lib/rate-limiter', () => ({
  rateLimit: vi.fn(),
  withRateLimit: vi.fn(),
}));

// Mock sanitize
vi.mock('../../src/lib/sanitize', () => ({
  sanitizeObject: vi.fn((obj: any) => {
    const sanitized = JSON.parse(JSON.stringify(obj));
    const removeScripts = (val: any): any => {
      if (typeof val === 'string') {
        return val.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      if (Array.isArray(val)) {
        return val.map(removeScripts);
      }
      if (val && typeof val === 'object') {
        const result: any = {};
        for (const key in val) {
          result[key] = removeScripts(val[key]);
        }
        return result;
      }
      return val;
    };
    return removeScripts(sanitized);
  }),
}));

// Import after mocking
import { applyRateLimit, sanitizeBody, withMiddleware } from '../../src/lib/api-middleware';
import { rateLimit } from '../../src/lib/rate-limiter';

describe('API Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit).mockReturnValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    });
  });

  describe('applyRateLimit', () => {
    it('should return shouldProceed true when under limit', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const result = applyRateLimit(req, 100, 60000);

      expect(result.shouldProceed).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should return rate limit response when over limit', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.1-over-limit' },
      });

      // Mock rateLimit to return failure
      vi.mocked(rateLimit).mockReturnValueOnce({
        success: false,
        limit: 5,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const result = applyRateLimit(req, 5, 60000);

      expect(result.shouldProceed).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(429);
    });

    it('should use API key for rate limiting when provided', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-api-key': 'test-api-key-123' },
      });

      const result = applyRateLimit(req, 100, 60000);

      expect(result.shouldProceed).toBe(true);
      expect(vi.mocked(rateLimit)).toHaveBeenCalledWith('api:test-api-key-123', 100, 60000);
    });

    it('should use x-real-ip as fallback', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-real-ip': '10.0.0.5' },
      });

      const result = applyRateLimit(req, 100, 60000);

      expect(result.shouldProceed).toBe(true);
    });

    it('should return unknown when no IP headers present', () => {
      const req = new NextRequest('http://localhost/api/test');

      const result = applyRateLimit(req, 100, 60000);

      expect(result.shouldProceed).toBe(true);
    });

    it('should parse multiple IPs from x-forwarded-for', () => {
      const req = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2, 10.0.0.3' },
      });

      const result = applyRateLimit(req, 100, 60000);

      expect(result.shouldProceed).toBe(true);
    });
  });

  describe('sanitizeBody', () => {
    it('should sanitize a valid body object', () => {
      const body = { title: 'Test Task', description: 'Description' };
      const result = sanitizeBody(body);

      expect(result).toEqual(body);
    });

    it('should remove script tags from strings', () => {
      const body = { title: '<script>alert("xss")</script>Test' };
      const result = sanitizeBody(body);

      expect(result.title).not.toContain('<script>');
    });

    it('should handle nested objects', () => {
      const body = {
        user: {
          name: '<script>evil</script>John'
        }
      };
      const result = sanitizeBody(body);

      expect(result.user.name).not.toContain('<script>');
    });

    it('should handle arrays', () => {
      const body = {
        items: ['<script>alert(1)</script>', 'normal']
      };
      const result = sanitizeBody(body);

      expect(result.items[0]).not.toContain('<script>');
    });
  });

  describe('withMiddleware', () => {
    it('should call handler with sanitized body when sanitize option is true', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const middleware = withMiddleware(handler, { sanitize: true });

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });

      await middleware(req);

      expect(handler).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(expect.any(NextRequest), expect.any(Object));
    });

    it('should return 400 for invalid JSON when sanitizing', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const middleware = withMiddleware(handler, { sanitize: true });

      const req = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        body: 'not valid json',
      });

      const response = await middleware(req);

      expect(response.status).toBe(400);
    });

    it('should skip sanitization for GET requests', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const middleware = withMiddleware(handler, { sanitize: true });

      const req = new NextRequest('http://localhost/api/test', {
        method: 'GET',
      });

      await middleware(req);

      expect(handler).toHaveBeenCalled();
    });

    it('should apply rate limiting when configured', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const middleware = withMiddleware(handler, {
        rateLimit: { limit: 10, windowMs: 60000 }
      });

      const req = new NextRequest('http://localhost/api/test');

      await middleware(req);

      expect(handler).toHaveBeenCalled();
    });

    it('should return rate limit response when limit exceeded', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const middleware = withMiddleware(handler, {
        rateLimit: { limit: 1, windowMs: 60000 }
      });

      // Mock rateLimit to fail
      vi.mocked(rateLimit).mockReturnValueOnce({
        success: false,
        limit: 1,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const req = new NextRequest('http://localhost/api/test');

      const response = await middleware(req);

      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should use default rate limit when number provided', async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
      const middleware = withMiddleware(handler, {
        rateLimit: 50
      });

      const req = new NextRequest('http://localhost/api/test');

      await middleware(req);

      expect(handler).toHaveBeenCalled();
    });
  });
});