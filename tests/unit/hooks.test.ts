/**
 * React Hooks Tests
 * Tests for custom React hooks
 */

import { describe, it, expect } from 'vitest';

describe('React Hooks', () => {
  describe('useAuth', () => {
    it('should export useAuth hook', async () => {
      const { useAuth } = await import('../../src/hooks/use-auth');
      expect(typeof useAuth).toBe('function');
    });

    it('should export AuthProvider', async () => {
      const { AuthProvider } = await import('../../src/hooks/use-auth');
      expect(typeof AuthProvider).toBe('function');
    });
  });

  describe('useSidebar', () => {
    it('should export useSidebar hook', async () => {
      const { useSidebar } = await import('../../src/hooks/use-sidebar');
      expect(typeof useSidebar).toBe('function');
    });
  });

  describe('useTaskStore', () => {
    it('should export useTaskStore hook', async () => {
      const { useTaskStore } = await import('../../src/hooks/use-task-store');
      expect(typeof useTaskStore).toBe('function');
    });
  });

  describe('useNotifications', () => {
    it('should export useNotifications hook', async () => {
      const { useNotifications } = await import('../../src/hooks/use-notifications');
      expect(typeof useNotifications).toBe('function');
    });
  });

  describe('useWebSocket', () => {
    it('should export useWebSocket hook', async () => {
      const { useWebSocket } = await import('../../src/hooks/use-websocket');
      expect(typeof useWebSocket).toBe('function');
    });
  });

  describe('useKeyboardShortcuts', () => {
    it('should export useKeyboardShortcuts hook', async () => {
      const { useKeyboardShortcuts } = await import('../../src/hooks/use-keyboard-shortcuts');
      expect(typeof useKeyboardShortcuts).toBe('function');
    });
  });

  describe('useAnalyticsRange', () => {
    it('should export useAnalyticsRange hook', async () => {
      const { useAnalyticsRange } = await import('../../src/hooks/use-analytics-range');
      expect(typeof useAnalyticsRange).toBe('function');
    });
  });

  // Note: useOfflineCache hook tests skipped due to complex dependencies
  // The hook itself is tested through integration tests
});
