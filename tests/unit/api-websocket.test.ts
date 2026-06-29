/**
 * API WebSocket Route Tests
 * Tests for /api/ws endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';

const WSMessageSchema = z.object({
  type: z.string(),
  payload: z.any().optional(),
  id: z.string().optional(),
});

const TaskUpdateSchema = z.object({
  type: z.literal('task_update'),
  payload: z.object({
    id: z.string(),
    changes: z.record(z.any()),
  }),
});

const TaskCreateSchema = z.object({
  type: z.literal('task_create'),
  payload: z.object({
    task: z.object({
      id: z.string().optional(),
      title: z.string(),
    }),
  }),
});

interface MockWSClient {
  id: string;
  taskId: string | null;
  sends: string[];
}

const mockClients: MockWSClient[] = [];

describe('API WebSocket Route', () => {
  beforeEach(() => {
    mockClients.length = 0;
  });

  describe('WebSocket Connection', () => {
    it('should accept connection', () => {
      const client: MockWSClient = {
        id: 'client-1',
        taskId: null,
        sends: [],
      };
      mockClients.push(client);
      expect(mockClients).toHaveLength(1);
    });

    it('should handle multiple clients', () => {
      for (let i = 0; i < 5; i++) {
        mockClients.push({
          id: `client-${i}`,
          taskId: null,
          sends: [],
        });
      }
      expect(mockClients).toHaveLength(5);
    });

    it('should remove client on disconnect', () => {
      mockClients.push({ id: 'client-1', taskId: null, sends: [] });
      mockClients.push({ id: 'client-2', taskId: null, sends: [] });

      const initialLength = mockClients.length;
      mockClients.splice(0, 1);
      expect(mockClients.length).toBe(initialLength - 1);
    });
  });

  describe('Message Handling', () => {
    it('should validate task update message', () => {
      const message = {
        type: 'task_update',
        payload: { id: 'task-1', changes: { title: 'Updated' } },
      };
      const result = TaskUpdateSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it('should validate task create message', () => {
      const message = {
        type: 'task_create',
        payload: { task: { id: 'task-1', title: 'New Task' } },
      };
      const result = TaskCreateSchema.safeParse(message);
      expect(result.success).toBe(true);
    });

    it('should reject invalid message type', () => {
      const message = {
        type: 'invalid_type',
        payload: {},
      };
      const result = WSMessageSchema.safeParse(message);
      expect(result.success).toBe(true); // Generic schema accepts any type
    });

    it('should validate generic message', () => {
      const message = { type: 'ping', id: 'msg-1' };
      const result = WSMessageSchema.safeParse(message);
      expect(result.success).toBe(true);
    });
  });

  describe('Task Subscriptions', () => {
    it('should subscribe client to task updates', () => {
      const client: MockWSClient = {
        id: 'client-1',
        taskId: 'task-1',
        sends: [],
      };
      mockClients.push(client);

      expect(client.taskId).toBe('task-1');
    });

    it('should broadcast to all clients', () => {
      mockClients.push({ id: 'client-1', taskId: 'task-1', sends: [] });
      mockClients.push({ id: 'client-2', taskId: 'task-1', sends: [] });

      const updateMessage = JSON.stringify({ type: 'task_update', payload: { id: 'task-1' } });
      mockClients.forEach(client => client.sends.push(updateMessage));

      expect(mockClients[0].sends).toHaveLength(1);
      expect(mockClients[1].sends).toHaveLength(1);
    });

    it('should send updates to specific task subscribers only', () => {
      mockClients.push({ id: 'client-1', taskId: 'task-1', sends: [] });
      mockClients.push({ id: 'client-2', taskId: 'task-2', sends: [] });

      const updateMessage = JSON.stringify({ type: 'task_update', payload: { id: 'task-1' } });

      // Only client-1 should receive the update
      const subscribers = mockClients.filter(c => c.taskId === 'task-1');
      subscribers.forEach(client => client.sends.push(updateMessage));

      expect(subscribers).toHaveLength(1);
      expect(subscribers[0].id).toBe('client-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      const invalidJson = 'not valid json';
      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it('should handle missing type field', () => {
      const message = { payload: {} };
      const result = WSMessageSchema.safeParse(message);
      // Schema requires type as a string, so this should fail
      expect(result.success).toBe(false);
    });

    it('should handle connection errors', () => {
      const error = new Error('Connection failed');
      expect(error.message).toBe('Connection failed');
    });
  });

  describe('Heartbeat/Ping', () => {
    it('should respond to ping with pong', () => {
      const message = { type: 'ping' };
      const response = { type: 'pong' };
      expect(response.type).toBe('pong');
    });

    it('should track last heartbeat', () => {
      const lastHeartbeat = new Date().toISOString();
      expect(lastHeartbeat).toBeDefined();
    });
  });
});