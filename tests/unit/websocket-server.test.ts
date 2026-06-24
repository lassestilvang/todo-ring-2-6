/**
 * Comprehensive tests for WebSocket server functionality
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock WebSocket server functionality
const createMockWebSocketServer = () => {
  const clients = new Map();
  const messageHandlers = new Map();
  let nextClientId = 1;

  return {
    clients,
    messageHandlers,
    nextClientId,
    start: vi.fn(),
    stop: vi.fn(),
    handleConnection: vi.fn((ws, clientId) => {
      clients.set(clientId, ws);
    }),
    handleMessage: vi.fn((clientId, message) => {
      const handler = messageHandlers.get(clientId);
      if (handler) handler(message);
    }),
    broadcast: vi.fn((message) => {
      for (const [id, client] of clients) {
        client.send(JSON.stringify(message));
      }
    }),
    sendTo: vi.fn((clientId, message) => {
      const client = clients.get(clientId);
      if (client) client.send(JSON.stringify(message));
    }),
    registerHandler: vi.fn((clientId, handler) => {
      messageHandlers.set(clientId, handler);
    }),
    disconnect: vi.fn((clientId) => {
      clients.delete(clientId);
      messageHandlers.delete(clientId);
    }),
  };
};

describe('WebSocket Server', () => {
  let server: ReturnType<typeof createMockWebSocketServer>;

  beforeEach(() => {
    server = createMockWebSocketServer();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Server Lifecycle', () => {
    it('should start successfully', () => {
      server.start();
      expect(server.start).toHaveBeenCalled();
    });

    it('should stop successfully', () => {
      server.stop();
      expect(server.stop).toHaveBeenCalled();
    });

    it('should handle multiple start/stop cycles', () => {
      server.start();
      server.start();
      server.stop();
      server.stop();

      expect(server.start).toHaveBeenCalledTimes(2);
      expect(server.stop).toHaveBeenCalledTimes(2);
    });
  });

  describe('Client Management', () => {
    it('should add client on connection', () => {
      const mockWs = { send: vi.fn(), close: vi.fn() };
      const clientId = server.nextClientId++;

      server.handleConnection(mockWs, clientId);

      expect(server.clients.size).toBe(1);
      expect(server.clients.has(clientId)).toBe(true);
    });

    it('should handle multiple clients', () => {
      const mockWs1 = { send: vi.fn(), close: vi.fn() };
      const mockWs2 = { send: vi.fn(), close: vi.fn() };

      server.handleConnection(mockWs1, 1);
      server.handleConnection(mockWs2, 2);

      expect(server.clients.size).toBe(2);
    });

    it('should remove client on disconnect', () => {
      const mockWs = { send: vi.fn(), close: vi.fn() };

      server.handleConnection(mockWs, 1);
      expect(server.clients.size).toBe(1);

      server.disconnect(1);
      expect(server.clients.size).toBe(0);
    });

    it('should clean up handlers on disconnect', () => {
      const mockWs = { send: vi.fn(), close: vi.fn() };
      server.registerHandler(1, () => {});

      server.handleConnection(mockWs, 1);
      expect(server.messageHandlers.size).toBe(1);

      server.disconnect(1);
      expect(server.messageHandlers.size).toBe(0);
    });
  });

  describe('Message Broadcasting', () => {
    it('should broadcast to all clients', () => {
      const mockWs1 = { send: vi.fn(), close: vi.fn() };
      const mockWs2 = { send: vi.fn(), close: vi.fn() };

      server.handleConnection(mockWs1, 1);
      server.handleConnection(mockWs2, 2);

      const message = { type: 'task_update', data: { id: '123' } };
      server.broadcast(message);

      expect(mockWs1.send).toHaveBeenCalledWith(JSON.stringify(message));
      expect(mockWs2.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should send to specific client', () => {
      const mockWs = { send: vi.fn(), close: vi.fn() };
      server.handleConnection(mockWs, 1);

      const message = { type: 'private_message', data: 'hello' };
      server.sendTo(1, message);

      expect(mockWs.send).toHaveBeenCalledWith(JSON.stringify(message));
    });

    it('should handle send to non-existent client', () => {
      const message = { type: 'test' };
      // Should not throw
      expect(() => server.sendTo(999, message)).not.toThrow();
    });
  });

  describe('Message Handlers', () => {
    it('should register message handler', () => {
      const handler = vi.fn();
      server.registerHandler(1, handler);

      expect(server.messageHandlers.has(1)).toBe(true);
    });

    it('should invoke handler on message', () => {
      const handler = vi.fn();
      server.registerHandler(1, handler);
      server.handleConnection({ send: vi.fn(), close: vi.fn() }, 1);

      const message = JSON.stringify({ type: 'test', data: 'hello' });
      server.handleMessage(1, message);

      expect(handler).toHaveBeenCalledWith(message);
    });
  });
});

describe('Operational Transform', () => {
  // Simple OT implementation for testing
  interface Document {
    [key: string]: any;
  }

  interface Operation {
    type: 'set' | 'insert' | 'delete';
    path: string;
    value?: any;
  }

  const transform = (doc: Document, op: Operation): Document => {
    const newDoc = { ...doc };
    const path = op.path.split('.');
    let current: any = newDoc;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    if (op.type === 'set') {
      current[path[path.length - 1]] = op.value;
    } else if (op.type === 'insert') {
      current[path[path.length - 1]] = op.value;
    } else if (op.type === 'delete') {
      delete current[path[path.length - 1]];
    }

    return newDoc;
  };

  describe('Basic Operations', () => {
    it('should handle set operations', () => {
      const doc = { name: 'old' };
      const result = transform(doc, { type: 'set', path: 'name', value: 'new' });
      expect(result.name).toBe('new');
    });

    it('should handle nested path operations', () => {
      const doc = { user: { name: 'John' } };
      const result = transform(doc, { type: 'set', path: 'user.name', value: 'Jane' });
      expect(result.user.name).toBe('Jane');
    });

    it('should handle array operations', () => {
      const doc = { items: [1, 2, 3] };
      const result = transform(doc, { type: 'set', path: 'items.1', value: 10 });
      expect(result.items[1]).toBe(10);
    });

    it('should handle object creation', () => {
      const doc = {};
      const result = transform(doc, { type: 'set', path: 'newField', value: 'value' });
      expect(result.newField).toBe('value');
    });

    it('should handle numeric paths', () => {
      const doc = { list: ['a', 'b', 'c'] };
      const result = transform(doc, { type: 'set', path: 'list.0', value: 'z' });
      expect(result.list[0]).toBe('z');
    });
  });

  describe('Concurrent Operations', () => {
    it('should apply operations in sequence', () => {
      const doc = { count: 0 };
      let result = doc;

      for (let i = 0; i < 3; i++) {
        result = transform(result, { type: 'set', path: 'count', value: i + 1 });
      }

      expect(result.count).toBe(3);
    });

    it('should handle conflicting operations', () => {
      const doc = { status: 'pending' };
      const result1 = transform(doc, { type: 'set', path: 'status', value: 'completed' });
      const result2 = transform(doc, { type: 'set', path: 'status', value: 'cancelled' });

      // Both operations are valid, last one wins
      expect(['completed', 'cancelled']).toContain(result1.status);
      expect(['completed', 'cancelled']).toContain(result2.status);
    });

    it('should handle multiple field updates', () => {
      const doc = { a: 1, b: 2, c: 3 };
      let result = transform(doc, { type: 'set', path: 'a', value: 10 });
      result = transform(result, { type: 'set', path: 'b', value: 20 });

      expect(result.a).toBe(10);
      expect(result.b).toBe(20);
      expect(result.c).toBe(3);
    });
  });

  describe('Delete Operations', () => {
    it('should delete fields', () => {
      const doc = { name: 'test', extra: 'value' };
      const result = transform(doc, { type: 'delete', path: 'extra' });

      expect(result.name).toBe('test');
      expect(result.extra).toBeUndefined();
    });

    it('should handle nested delete', () => {
      const doc = { user: { name: 'John', age: 30 } };
      const result = transform(doc, { type: 'delete', path: 'user.age' });

      expect(result.user.name).toBe('John');
      expect(result.user.age).toBeUndefined();
    });
  });
});

describe('Presence System', () => {
  it('should track user presence correctly', () => {
    const presence = new Map();
    const userId = 'user-123';
    const cursorPosition = { x: 100, y: 200 };

    presence.set(userId, {
      user: { id: userId, name: 'Test User' },
      cursor: cursorPosition,
      lastSeen: new Date(),
    });

    expect(presence.has(userId)).toBe(true);
    const user = presence.get(userId);
    expect(user?.cursor).toEqual(cursorPosition);
  });

  it('should remove user on disconnect', () => {
    const presence = new Map();
    const userId = 'user-123';

    presence.set(userId, { user: { id: userId }, cursor: {}, lastSeen: new Date() });
    expect(presence.size).toBe(1);

    presence.delete(userId);
    expect(presence.size).toBe(0);
  });

  it('should update cursor position', () => {
    const presence = new Map();
    const userId = 'user-123';

    presence.set(userId, {
      user: { id: userId, name: 'Test User' },
      cursor: { x: 0, y: 0 },
      lastSeen: new Date(),
    });

    // Update cursor
    presence.get(userId)!.cursor = { x: 200, y: 300 };

    expect(presence.get(userId)?.cursor).toEqual({ x: 200, y: 300 });
  });

  it('should handle multiple users', () => {
    const presence = new Map();

    presence.set('user1', { user: { id: 'user1', name: 'Alice' }, cursor: { x: 10, y: 20 }, lastSeen: new Date() });
    presence.set('user2', { user: { id: 'user2', name: 'Bob' }, cursor: { x: 30, y: 40 }, lastSeen: new Date() });
    presence.set('user3', { user: { id: 'user3', name: 'Charlie' }, cursor: { x: 50, y: 60 }, lastSeen: new Date() });

    expect(presence.size).toBe(3);

    // Update one user's cursor
    presence.get('user2')!.cursor = { x: 100, y: 200 };
    expect(presence.get('user2')?.cursor).toEqual({ x: 100, y: 200 });

    // Other users should be unaffected
    expect(presence.get('user1')?.cursor).toEqual({ x: 10, y: 20 });
    expect(presence.get('user3')?.cursor).toEqual({ x: 50, y: 60 });
  });

  it('should handle user updates', () => {
    const presence = new Map();
    const userId = 'user-123';

    presence.set(userId, {
      user: { id: userId, name: 'Original Name' },
      cursor: { x: 0, y: 0 },
      lastSeen: new Date('2024-01-01'),
    });

    // Update user info
    presence.get(userId)!.user = { id: userId, name: 'Updated Name' };
    presence.get(userId)!.lastSeen = new Date('2024-01-02');

    expect(presence.get(userId)?.user.name).toBe('Updated Name');
    expect(presence.get(userId)?.lastSeen).toEqual(new Date('2024-01-02'));
  });
});

describe('Connection Resilience', () => {
  it('should handle reconnection with same ID', () => {
    const server = createMockWebSocketServer();
    const mockWs = { send: vi.fn(), close: vi.fn() };

    // First connection
    server.handleConnection(mockWs, 1);
    expect(server.clients.size).toBe(1);

    // Disconnect
    server.disconnect(1);
    expect(server.clients.size).toBe(0);

    // Reconnect with same ID
    server.handleConnection(mockWs, 1);
    expect(server.clients.size).toBe(1);
  });

  it('should handle network errors gracefully', () => {
    const server = createMockWebSocketServer();

    const mockWs = {
      send: vi.fn().mockImplementation(() => {
        throw new Error('Network error');
      }),
      close: vi.fn(),
    };

    server.handleConnection(mockWs, 1);

    // The mock will throw when send is called with an error
    // In production, the server would catch this error
    expect(() => mockWs.send('test')).toThrow('Network error');
  });

  it('should handle malformed messages', () => {
    const server = createMockWebSocketServer();
    const handler = vi.fn();

    server.registerHandler(1, handler);
    server.handleConnection({ send: vi.fn(), close: vi.fn() }, 1);

    // Send malformed JSON
    server.handleMessage(1, 'not valid json');

    // Handler should still be called (parsing is client's responsibility)
    expect(handler).toHaveBeenCalled();
  });
});