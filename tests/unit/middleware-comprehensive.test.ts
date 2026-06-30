/**
 * Comprehensive tests for src/middleware.ts
 * Tests authentication flow, protected routes, public routes, and static assets
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock NextResponse
vi.mock('next/server', () => ({
  NextResponse: {
    next: vi.fn(() => new Response()),
    json: vi.fn((body, init) => {
      const response = new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json' } });
      return response;
    }),
  },
}));

// Mock rate-limiter
vi.mock('../../src/lib/rate-limiter', () => ({
  rateLimit: vi.fn(() => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 60000,
  })),
}));

describe('Middleware - Comprehensive', () => {
  let middleware: (request: any) => Response;
  let mockNext: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the module
    const module = await import('../../src/middleware');
    middleware = module.middleware;

    mockNext = vi.mocked(NextResponse.next);
    mockJson = vi.mocked(NextResponse.json);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Static Assets', () => {
    it('should skip middleware for _next/static paths', async () => {
      const request = createMockRequest('/_next/static/chunks/foo.js');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip middleware for _next/image paths', async () => {
      const request = createMockRequest('/_next/image?url=...&w=1200');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip middleware for favicon.ico', async () => {
      const request = createMockRequest('/favicon.ico');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip middleware for /static paths', async () => {
      const request = createMockRequest('/static/images/logo.png');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Public Routes', () => {
    it('should allow access to /api/auth/login', async () => {
      const request = createMockRequest('/api/auth/login');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access to /api/auth/register', async () => {
      const request = createMockRequest('/api/auth/register');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access to /api/auth/logout', async () => {
      const request = createMockRequest('/api/auth/logout');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access to nested auth routes', async () => {
      const request = createMockRequest('/api/auth/login/special');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Protected Routes - Authentication Required', () => {
    it('should block /api/tasks without auth token', async () => {
      const request = createMockRequest('/api/tasks');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
      const body = await response.json();
      expect(body).toEqual({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    });

    it('should block /api/lists without auth token', async () => {
      const request = createMockRequest('/api/lists');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should block /api/labels without auth token', async () => {
      const request = createMockRequest('/api/labels');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should block /api/subtasks without auth token', async () => {
      const request = createMockRequest('/api/subtasks');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should block /api/comments without auth token', async () => {
      const request = createMockRequest('/api/comments');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should block /api/sharing without auth token', async () => {
      const request = createMockRequest('/api/sharing');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should block /api/export without auth token', async () => {
      const request = createMockRequest('/api/export');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should block /api/analytics without auth token', async () => {
      const request = createMockRequest('/api/analytics');
      const response = await middleware(request) as Response;

      expect(mockJson).toHaveBeenCalled();
    });

    it('should allow /api/tasks with valid Bearer token', async () => {
      const request = createMockRequest('/api/tasks', {
        authorization: 'Bearer valid-token',
      });
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow /api/lists with valid Bearer token', async () => {
      const request = createMockRequest('/api/lists', {
        authorization: 'Bearer valid-token',
      });
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow nested paths under protected routes', async () => {
      const request = createMockRequest('/api/tasks/123/subtasks', {
        authorization: 'Bearer valid-token',
      });
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Config', () => {
    it('should export config with matcher', async () => {
      const module = await import('../../src/middleware');
      expect(module.config).toBeDefined();
      expect(module.config.matcher).toBeDefined();
      expect(module.config.matcher).toEqual(['/((?!_next/static|_next/image|favicon.ico).*)']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown routes by allowing them', async () => {
      const request = createMockRequest('/api/unknown');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty path', async () => {
      const request = createMockRequest('/');
      await middleware(request);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle authorization header without Bearer prefix', async () => {
      const request = createMockRequest('/api/tasks', {
        authorization: 'invalid-format',
      });
      // Should still be treated as no token (null)
      const response = await middleware(request) as Response;
      expect(mockJson).toHaveBeenCalled();
    });

    it('should handle authorization header with only Bearer', async () => {
      const request = createMockRequest('/api/tasks', {
        authorization: 'Bearer ',
      });
      // Empty token after Bearer is falsy, so it should be rejected
      const response = await middleware(request) as Response;
      expect(mockJson).toHaveBeenCalled();
    });
  });
});

// Helper function to create mock request
function createMockRequest(pathname: string, headers: Record<string, string> = {}): any {
  return {
    nextUrl: {
      pathname,
    },
    headers: {
      get: (key: string) => headers[key.toLowerCase()] || null,
    },
  };
}