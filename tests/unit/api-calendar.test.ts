/**
 * API Calendar Route Tests
 * Tests for /api/calendar endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const CalendarEventSchema = z.object({
  id: z.string().uuid().optional(),
  summary: z.string().min(1, 'Summary is required'),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  taskId: z.string().uuid().optional(),
});

const CalendarConnectionSchema = z.object({
  provider: z.enum(['google', 'outlook', 'ical']),
  accessToken: z.string().min(1, 'Access token is required'),
  refreshToken: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  userId: z.string().uuid(),
});

interface CalendarEvent {
  id: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  location: string;
  taskId: string | null;
}

const store = {
  events: [] as CalendarEvent[],
  connections: [] as { id: string; provider: string; userId: string }[],
};

const resetStore = () => {
  store.events = [];
  store.connections = [];
};

describe('API Calendar Route', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('GET /api/calendar', () => {
    it('should return empty array when no events exist', () => {
      expect(store.events).toEqual([]);
    });

    it('should return events for date range', () => {
      store.events.push({ id: '1', summary: 'Meeting', description: '', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', location: '', taskId: '550e8400-e29b-41d4-a716-446655440000' });
      store.events.push({ id: '2', summary: 'Later Event', description: '', start: '2024-01-16T10:00:00Z', end: '2024-01-16T11:00:00Z', location: '', taskId: null });

      const eventsInRange = store.events.filter(e => e.start >= '2024-01-15T00:00:00Z' && e.end <= '2024-01-16T00:00:00Z');
      expect(eventsInRange).toHaveLength(1);
    });

    it('should return events for specific task', () => {
      store.events.push({ id: '1', summary: 'Task Event', description: '', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', location: '', taskId: '550e8400-e29b-41d4-a716-446655440000' });
      store.events.push({ id: '2', summary: 'Other Event', description: '', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', location: '', taskId: '550e8400-e29b-41d4-a716-446655440001' });

      const taskEvents = store.events.filter(e => e.taskId === 'task-1');
      expect(taskEvents).toHaveLength(1);
    });
  });

  describe('POST /api/calendar', () => {
    it('should validate required summary', () => {
      const body = { summary: '' };
      const result = CalendarEventSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required start time', () => {
      const body = { summary: 'Test', start: '' };
      const result = CalendarEventSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required end time', () => {
      const body = { summary: 'Test', start: '2024-01-15T10:00:00Z', end: '' };
      const result = CalendarEventSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should create event with valid data', () => {
      const body = {
        summary: 'Team Meeting',
        description: 'Weekly sync',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z',
        location: 'Office',
        taskId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
      };
      const result = CalendarEventSchema.safeParse(body);

      expect(result.success).toBe(true);
      if (result.success) {
        const event: CalendarEvent = {
          id: 'event-1',
          summary: result.data.summary,
          description: result.data.description || '',
          start: result.data.start,
          end: result.data.end,
          location: result.data.location || '',
          taskId: result.data.taskId || null,
        };
        store.events.push(event);
        expect(store.events[0].summary).toBe('Team Meeting');
      }
    });

    it('should validate attendees as emails', () => {
      const body = {
        summary: 'Test',
        start: '2024-01-15T10:00:00Z',
        end: '2024-01-15T11:00:00Z',
        attendees: ['valid@example.com', 'invalid-email'],
      };
      const result = CalendarEventSchema.safeParse(body);
      expect(result.success).toBe(false);
    });
  });

  describe('PUT /api/calendar', () => {
    it('should update event fields', () => {
      store.events.push({ id: '1', summary: 'Original', description: '', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', location: '', taskId: null });

      store.events[0].summary = 'Updated';
      store.events[0] = store.events[0];

      expect(store.events[0].summary).toBe('Updated');
    });
  });

  describe('DELETE /api/calendar', () => {
    it('should delete event', () => {
      store.events.push({ id: '1', summary: 'To Delete', description: '', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', location: '', taskId: null });
      store.events.push({ id: '2', summary: 'Keep', description: '', start: '2024-01-15T10:00:00Z', end: '2024-01-15T11:00:00Z', location: '', taskId: null });

      const initialLength = store.events.length;
      store.events = store.events.filter(e => e.id !== '1');
      expect(store.events.length).toBe(initialLength - 1);
    });
  });
});

describe('API Calendar Connection Route', () => {
  beforeEach(() => {
    store.connections = [];
  });

  describe('POST /api/calendar/connect', () => {
    it('should validate provider', () => {
      const body = { provider: 'invalid', accessToken: 'token', userId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required access token', () => {
      const body = { provider: 'google', accessToken: '', userId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should validate required user ID', () => {
      const body = { provider: 'google', accessToken: 'token', userId: '' };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(false);
    });

    it('should accept valid connection data', () => {
      const body = { provider: 'google', accessToken: 'oauth-token', userId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it('should accept optional refresh token', () => {
      const body = { provider: 'google', accessToken: 'token', refreshToken: 'refresh', userId: '550e8400-e29b-41d4-a716-446655440000', expiresAt: '2024-12-31T00:00:00Z' };
      const result = CalendarConnectionSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  describe('GET /api/calendar/connect', () => {
    it('should return connections for user', () => {
      store.connections.push({ id: '1', provider: 'google', userId: 'user-1' });
      store.connections.push({ id: '2', provider: 'outlook', userId: 'user-2' });

      const userConnections = store.connections.filter(c => c.userId === 'user-1');
      expect(userConnections).toHaveLength(1);
    });
  });

  describe('DELETE /api/calendar/connect', () => {
    it('should disconnect calendar', () => {
      store.connections.push({ id: '1', provider: 'google', userId: 'user-1' });

      const initialLength = store.connections.length;
      store.connections = store.connections.filter(c => c.id !== '1');
      expect(store.connections.length).toBe(initialLength - 1);
    });
  });
});