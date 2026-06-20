/**
 * SSR-specific tests for auth.ts
 * Tests the window === undefined branch
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// This test file needs to test the SSR branch where window is undefined
// We'll do this by temporarily removing the window mock

describe('Auth SSR Tests', () => {
  let originalWindow: any;

  beforeEach(() => {
    // Store original window
    originalWindow = (global as any).window;
    // Remove window to simulate SSR
    delete (global as any).window;
  });

  afterEach(() => {
    // Restore window
    (global as any).window = originalWindow;
  });

  it('should return null when window is undefined (SSR)', async () => {
    // Clear module cache to re-import auth
    vi.resetModules();

    // Re-import auth module which will now see window as undefined
    const auth = await import('../../src/lib/auth');

    const user = auth.getClientUser();
    expect(user).toBeNull();
  });
});