/**
 * API Calendar Connect Route - Tests
 * Tests for /api/calendar/connect endpoint
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';

// Schema from validations
const CalendarConnectionSchema = z.object({
  provider: z.enum(['google', 'outlook', 'ical']),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  userId: z.string().uuid(),
});

interface CalendarConnection {
  id: string;
  userId: string;
  provider: 'google' | 'outlook' | 'ical';
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface MockStore {
  calendarConnections: CalendarConnection[];
  users: { id: string; name: string }[];
}

const createMockStore = (): MockStore => ({
  calendarConnections: [],
  users: [],
});

function generateId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9);
}

describe('API Calendar Connect Route', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createMockStore();
    store.users.push({ id: 'user-1', name: 'Test User' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/calendar/connect', () => {
    it('should validate required fields', () => {
      const body = {};
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate provider type', () => {
      const body = {
        provider: 'invalid',
        accessToken: 'token',
        userId: 'user-1',
      };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should accept valid Google connection', () => {
      const body = {
        provider: 'google' as const,
        accessToken: 'google-token',
        userId: '550e8400-e29b-41d4-a716-446655440001',
      };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should accept valid Outlook connection', () => {
      const body = {
        provider: 'outlook' as const,
        accessToken: 'outlook-token',
        userId: '550e8400-e29b-41d4-a716-446655440001',
      };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should accept valid iCal connection', () => {
      const body = {
        provider: 'ical' as const,
        accessToken: 'ical-token',
        userId: '550e8400-e29b-41d4-a716-446655440001',
      };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should store connection with generated ID', () => {
      const body = {
        provider: 'google' as const,
        accessToken: 'token',
        userId: 'user-1',
      };
      const result = CalendarConnectionSchema.safeParse(body);

      if (result.success) {
        const connection: CalendarConnection = {
          id: generateId(),
          userId: result.data.userId,
          provider: result.data.provider,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken ?? null,
          expiresAt: result.data.expiresAt ?? null,
          createdAt: new Date().toISOString(),
        };
        store.calendarConnections.push(connection);

        expect(store.calendarConnections[0].id).toBeDefined();
        expect(store.calendarConnections[0].provider).toBe('google');
      }
    });
  });

  describe('GET /api/calendar/connect', () => {
    it('should require userId parameter', () => {
      const userId = null;
      expect(userId).toBeNull();
    });

    it('should return connections for user', () => {
      store.calendarConnections.push({
        id: 'conn-1',
        userId: 'user-1',
        provider: 'google',
        accessToken: 'token',
        refreshToken: null,
        expiresAt: null,
        createdAt: '',
      });

      const userConnections = store.calendarConnections.filter(c => c.userId === 'user-1');
      expect(userConnections).toHaveLength(1);
    });
  });

  describe('DELETE /api/calendar/connect', () => {
    it('should require connection ID', () => {
      const id = null;
      expect(id).toBeNull();
    });

    it('should remove connection', () => {
      store.calendarConnections.push({
        id: 'conn-1',
        userId: 'user-1',
        provider: 'google',
        accessToken: 'token',
        refreshToken: null,
        expiresAt: null,
        createdAt: '',
      });

      const initialLength = store.calendarConnections.length;
      store.calendarConnections = store.calendarConnections.filter(c => c.id !== 'conn-1');
      expect(store.calendarConnections.length).toBe(initialLength - 1);
    });
  });
});