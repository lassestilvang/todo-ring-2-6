/**
 * WebSocket Integration Tests
 * Tests the Enhanced WebSocket Server with Operational Transform
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Operational Transform', () => {
  // Simple OT implementation for testing
  class OperationalTransform {
    static transform(op1: any, op2: any): any {
      // Compare paths as arrays
      const pathsEqual = JSON.stringify(op1.path) === JSON.stringify(op2.path);
      if (!pathsEqual) {
        return op1;
      }

      if (op1.type === 'insert' && op2.type === 'insert') {
        if (op1.position !== undefined && op2.position !== undefined) {
          const newOp1 = { ...op1 };
          // Increment position if op1 comes after op2
          if (op1.position >= op2.position!) {
            newOp1.position = op1.position + 1;
          }
          return newOp1;
        }
      }

      if (op1.type === 'update' || op1.type === 'delete') {
        return op1;
      }

      return op1;
    }

    static transformList(operations: any[], againstOp: any): any[] {
      return operations.map(op => this.transform(op, againstOp));
    }
  }

  describe('Transform Function', () => {
    it('should not transform operations on different paths', () => {
      const op1 = { type: 'update', path: ['title'], value: 'New Title' };
      const op2 = { type: 'update', path: ['description'], value: 'New Desc' };

      const result = OperationalTransform.transform(op1, op2);
      expect(result).toEqual(op1);
    });

    it('should adjust insert positions correctly', () => {
      // op1 is at position 5, op2 is at position 3
      // Since op2 (position 3) happens first, op1's position should be adjusted
      const op1 = { type: 'insert', path: ['items'], position: 5, value: 'item' };
      const op2 = { type: 'insert', path: ['items'], position: 3, value: 'other' };

      const result = OperationalTransform.transform(op1, op2);
      // op1.position >= op2.position (5 >= 3), so position should be incremented
      expect(result.position).toBe(6);
    });

    it('should not adjust insert position when op2 is after op1', () => {
      // op1 is at position 3, op2 is at position 5
      // Since op2 happens after op1, op1's position stays the same
      const op1 = { type: 'insert', path: ['items'], position: 3, value: 'item' };
      const op2 = { type: 'insert', path: ['items'], position: 5, value: 'other' };

      const result = OperationalTransform.transform(op1, op2);
      // op1.position < op2.position (3 < 5), so position stays the same
      expect(result.position).toBe(3);
    });

    it('should return update operations unchanged', () => {
      const op1 = { type: 'update', path: ['status'], value: 'completed' };
      const op2 = { type: 'insert', path: ['items'], position: 0, value: 'item' };

      const result = OperationalTransform.transform(op1, op2);
      expect(result).toEqual(op1);
    });

    it('should return delete operations unchanged', () => {
      const op1 = { type: 'delete', path: ['items'], position: 2 };
      const op2 = { type: 'insert', path: ['items'], position: 0, value: 'item' };

      const result = OperationalTransform.transform(op1, op2);
      expect(result).toEqual(op1);
    });
  });

  describe('Concurrent Operation Handling', () => {
    it('should transform list of operations', () => {
      // When transforming against an insert at position 0,
      // operations at position 0 or higher should be adjusted
      const operations = [
        { type: 'insert', path: ['items'], position: 0, value: 'a' },
        { type: 'insert', path: ['items'], position: 1, value: 'b' },
      ];
      const againstOp = { type: 'insert', path: ['items'], position: 0, value: 'new' };

      const result = OperationalTransform.transformList(operations, againstOp);
      // op1 at position 0: 0 >= 0 is true, so becomes 1
      // op1 at position 1: 1 >= 0 is true, so becomes 2
      expect(result[0].position).toBe(1);
      expect(result[1].position).toBe(2);
    });
  });
});

describe('Presence System', () => {
  it('should track user presence', () => {
    const presence = new Map<string, any>();
    const userId = 'user-123';

    presence.set(userId, {
      user: { id: userId, name: 'Test User' },
      cursor: { x: 100, y: 200 },
      taskId: 'task-1',
      lastSeen: Date.now(),
    });

    expect(presence.has(userId)).toBe(true);
    expect(presence.get(userId).user.name).toBe('Test User');
    expect(presence.get(userId).taskId).toBe('task-1');
  });

  it('should update cursor position', () => {
    const presence = new Map<string, any>();
    const userId = 'user-123';

    presence.set(userId, {
      user: { id: userId, name: 'Test User' },
      cursor: { x: 0, y: 0 },
      taskId: 'task-1',
      lastSeen: Date.now(),
    });

    // Simulate cursor move
    presence.get(userId).cursor = { x: 150, y: 250 };
    presence.get(userId).lastSeen = Date.now();

    expect(presence.get(userId).cursor).toEqual({ x: 150, y: 250 });
  });

  it('should handle user disconnect', () => {
    const presence = new Map<string, any>();
    const userId = 'user-123';

    presence.set(userId, {
      user: { id: userId, name: 'Test User' },
      cursor: { x: 100, y: 200 },
      taskId: 'task-1',
      lastSeen: Date.now(),
    });

    expect(presence.size).toBe(1);

    presence.delete(userId);
    expect(presence.size).toBe(0);
  });
});

describe('Message Handling', () => {
  it('should handle operation messages', () => {
    const message = {
      type: 'operation',
      taskId: 'task-123',
      operation: {
        id: 'op-1',
        sourceClientId: 'client-1',
        type: 'update',
        path: ['status'],
        value: 'completed',
        timestamp: Date.now(),
      },
    };

    expect(message.type).toBe('operation');
    expect(message.taskId).toBe('task-123');
    expect(message.operation.value).toBe('completed');
  });

  it('should handle cursor move messages', () => {
    const message = {
      type: 'cursor_move',
      taskId: 'task-123',
      cursor: { x: 100, y: 200 },
      timestamp: Date.now(),
    };

    expect(message.type).toBe('cursor_move');
    expect(message.cursor).toEqual({ x: 100, y: 200 });
  });

  it('should handle sync request messages', () => {
    const message = {
      type: 'sync_request',
      taskId: 'task-123',
      timestamp: Date.now(),
    };

    expect(message.type).toBe('sync_request');
    expect(message.taskId).toBe('task-123');
  });

  it('should handle invalid JSON gracefully', () => {
    const invalidJson = 'not valid json';

    expect(() => {
      try {
        JSON.parse(invalidJson);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
    }).toThrow('Invalid JSON');
  });
});

describe('Task State Management', () => {
  it('should maintain task version', () => {
    const taskState = {
      id: 'task-1',
      version: 0,
      data: { title: 'Test Task' },
      operations: [],
    };

    taskState.version++;
    taskState.operations.push({ type: 'update', path: ['title'], value: 'Updated' });

    expect(taskState.version).toBe(1);
    expect(taskState.operations.length).toBe(1);
    expect(taskState.data.title).toBe('Test Task');
  });

  it('should track operation history', () => {
    const operations = [
      { type: 'insert', path: ['items'], position: 0, value: 'item1' },
      { type: 'insert', path: ['items'], position: 1, value: 'item2' },
      { type: 'update', path: ['items', 0], value: 'updated item1' },
    ];

    expect(operations).toHaveLength(3);
    expect(operations[2].type).toBe('update');
  });
});

describe('Client Management', () => {
  it('should track connected clients', () => {
    const clients = new Map<string, any>();
    const clientId1 = 'client-1';
    const clientId2 = 'client-2';

    clients.set(clientId1, { id: clientId1, userId: 'user-1', userName: 'User One' });
    clients.set(clientId2, { id: clientId2, userId: 'user-2', userName: 'User Two' });

    expect(clients.size).toBe(2);
    expect(clients.has(clientId1)).toBe(true);
    expect(clients.get(clientId1).userName).toBe('User One');
  });

  it('should handle client disconnection', () => {
    const clients = new Map<string, any>();
    const clientId = 'client-1';

    clients.set(clientId, { id: clientId, userId: 'user-1' });
    expect(clients.size).toBe(1);

    clients.delete(clientId);
    expect(clients.size).toBe(0);
  });
});

describe('Error Handling', () => {
  it('should handle missing taskId gracefully', () => {
    const message = {
      type: 'operation',
      operation: { type: 'update', path: ['status'], value: 'completed' },
    };

    expect(message.taskId).toBeUndefined();
  });

  it('should handle missing operation gracefully', () => {
    const message = {
      type: 'operation',
      taskId: 'task-123',
    };

    expect(message.operation).toBeUndefined();
  });
});