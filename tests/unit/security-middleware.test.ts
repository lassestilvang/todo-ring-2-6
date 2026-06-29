import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityMiddleware } from '@/middleware/security';
import type { NextRequest } from 'next/server';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;

  beforeEach(() => {
    middleware = new SecurityMiddleware();
  });

  it('should initialize with default rate limit config', () => {
    expect(middleware).toBeDefined();
  });

  it('should apply security headers', () => {
    const response = new Response();
    const result = middleware.applySecurityHeaders(response as any);

    expect((result as any).headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect((result as any).headers.get('X-Frame-Options')).toBe('DENY');
    expect((result as any).headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should apply CSP headers', () => {
    const response = new Response();
    const result = middleware.applyCSP(response as any);

    const csp = (result as any).headers.get('Content-Security-Policy');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
  });

  it('should extract client IP from X-Forwarded-For header', () => {
    const request = {
      headers: new Headers({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }),
      ip: '127.0.0.1'
    } as unknown as NextRequest;

    const ip = middleware['getClientIP'](request);
    expect(ip).toBe('192.168.1.1');
  });

  it('should fallback to request.ip when no forwarded header', () => {
    const request = {
      headers: new Headers(),
      ip: '127.0.0.1'
    } as unknown as NextRequest;

    const ip = middleware['getClientIP'](request);
    expect(ip).toBe('127.0.0.1');
  });

  it('should rate limit requests', async () => {
    const middlewareWithLowLimit = new SecurityMiddleware({ windowMs: 1000, max: 2 });
    const request = {
      headers: new Headers(),
      ip: '127.0.0.1',
      nextUrl: new URL('http://localhost/test')
    } as unknown as NextRequest;

    // First two requests should pass
    const result1 = await middlewareWithLowLimit.rateLimit(request);
    expect(result1).toBeNull();

    const result2 = await middlewareWithLowLimit.rateLimit(request);
    expect(result2).toBeNull();

    // Third request should be rate limited
    const result3 = await middlewareWithLowLimit.rateLimit(request);
    expect(result3).not.toBeNull();
    expect((result3 as any).status).toBe(429);
  });
});

describe('SecurityMiddleware - JWT Validation', () => {
  let middleware: SecurityMiddleware;

  beforeEach(() => {
    middleware = new SecurityMiddleware();
  });

  it('should validate a properly formatted JWT', async () => {
    // Create a mock JWT (header.payload.signature)
    const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

    const result = await middleware.validateJWT(mockJwt);
    expect(result.valid).toBe(true);
    expect(result.payload).toBeDefined();
  });

  it('should reject malformed JWT', async () => {
    const result = await middleware.validateJWT('invalid-token');
    expect(result.valid).toBe(false);
  });

  it('should reject empty token', async () => {
    const result = await middleware.validateJWT('');
    expect(result.valid).toBe(false);
  });
});