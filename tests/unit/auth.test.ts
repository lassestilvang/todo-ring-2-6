/**
 * Tests for src/lib/auth.ts
 */
import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Set up globals before importing auth module
(global as any).window = { localStorage: localStorageMock };
(global as any).localStorage = localStorageMock;

// Import auth functions after setting up mocks
import {
  generateUserId,
  getClientUser as getCurrentUser,
  setClientUser as setCurrentUser,
  clearClientUser as clearCurrentUser,
  createGuestUser,
} from '../../src/lib/auth';

describe('Auth Module', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('generateUserId', () => {
    it('should generate a unique user ID', () => {
      const id1 = generateUserId();
      const id2 = generateUserId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
    });

    it('should generate ID with correct prefix', () => {
      const id = generateUserId();
      expect(id).toMatch(/^user_/);
    });

    it('should generate ID with sufficient length', () => {
      const id = generateUserId();
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is set', () => {
      const user = getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return the stored user', () => {
      const mockUser = {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
      };
      setCurrentUser(mockUser);

      const user = getCurrentUser();
      expect(user).toEqual(mockUser);
    });
  });

  describe('setCurrentUser', () => {
    it('should store user in localStorage', () => {
      const mockUser = {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
      };
      setCurrentUser(mockUser);

      const stored = localStorageMock.getItem('taskplanner-user');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!).name).toBe('Test User');
    });
  });

  describe('clearCurrentUser', () => {
    it('should remove user from localStorage', () => {
      const mockUser = {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
      };
      setCurrentUser(mockUser);
      clearCurrentUser();

      expect(localStorageMock.getItem('taskplanner-user')).toBeNull();
    });
  });

  describe('createGuestUser', () => {
    it('should create a guest user with default properties', () => {
      const user = createGuestUser();

      expect(user.id).toBeDefined();
      expect(user.name).toMatch(/^Guest [a-f0-9]{4}$/);
      expect(user.email).toMatch(/^guest[a-f0-9]{4}@taskplanner\.local$/);
    });

    it('should store the guest user', () => {
      const user = createGuestUser();
      const stored = getCurrentUser();

      expect(stored).toEqual(user);
    });

    it('should create unique guest users', () => {
      const user1 = createGuestUser();
      const user2 = createGuestUser();

      expect(user1.id).not.toBe(user2.id);
      // IDs are unique, emails derived from IDs will also be unique
      expect(user1.email).toContain('guest');
      expect(user2.email).toContain('guest');
    });
  });
});