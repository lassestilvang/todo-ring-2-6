/**
 * WebSocket Server for Real-time Collaboration
 * Handles task updates, presence tracking, and conflict resolution
 *
 * Usage: Import and call startWebSocketServer() in your app initialization
 */

import { WebSocketServer, WebSocket } from 'ws';

interface Client {
  id: string;
  userId: string;
  userName: string;
  taskId?: string;
  listId?: string;
  cursor?: { x: number; y: number };
  ws: WebSocket;
}

interface TaskUpdate {
  type: 'task_update' | 'task_create' | 'task_delete' | 'presence' | 'cursor_move';
  taskId?: string;
  listId?: string;
  userId?: string;
  userName?: string;
  data?: Record<string, any>;
  timestamp?: number;
  left?: boolean;
}

class CollaborativeWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private taskVersions: Map<string, number> = new Map();

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port, host: '0.0.0.0' });
    this.setupHandlers();
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const url = new URL((request as any).url || 'ws://localhost', `http://${(request as any).headers?.host}`);
      const userId = url.searchParams.get('userId') || crypto.randomUUID();
      const userName = url.searchParams.get('userName') || 'Anonymous';
      const taskId = url.searchParams.get('taskId') ?? undefined;
      const listId = url.searchParams.get('listId') ?? undefined;

      const clientId = crypto.randomUUID();
      const client: Client = {
        id: clientId,
        userId,
        userName,
        taskId,
        listId,
        ws: request as unknown as WebSocket,
      };

      this.clients.set(clientId, client);

      // Send welcome message
      this.sendToClient(client, {
        type: 'presence',
        userId,
        userName,
        taskId: taskId || undefined,
        listId: listId || undefined,
        timestamp: Date.now(),
      });

      // Broadcast presence to others
      this.broadcastOthers(client, {
        type: 'presence',
        userId,
        userName,
        taskId: taskId || undefined,
        timestamp: Date.now(),
      }, taskId || undefined);

      ws.on('message', (data: string) => {
        this.handleMessage(client, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(client);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
  }

  private handleMessage(client: Client, data: string) {
    try {
      const message: TaskUpdate = JSON.parse(data);

      switch (message.type) {
        case 'task_update':
          this.handleTaskUpdate(client, message);
          break;
        case 'cursor_move':
          this.handleCursorMove(client, message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private handleTaskUpdate(client: Client, message: TaskUpdate) {
    if (!message.taskId || !message.data) return;

    const currentVersion = this.taskVersions.get(message.taskId) || 0;
    const clientVersion = (message.data as any).version || 0;

    // Conflict resolution: client is out of sync
    if (clientVersion < currentVersion) {
      this.sendToClient(client, {
        type: 'task_update',
        taskId: message.taskId,
        userId: 'server',
        data: { conflict: true, serverVersion: currentVersion },
        timestamp: Date.now(),
      });
      return;
    }

    // Update version
    this.taskVersions.set(message.taskId, clientVersion + 1);

    // Broadcast to others
    this.broadcastOthers(client, message, message.taskId);
  }

  private handleCursorMove(client: Client, message: TaskUpdate) {
    client.cursor = message.data?.cursor;
    this.broadcastOthers(client, message, message.taskId);
  }

  private handleDisconnect(client: Client) {
    this.clients.delete(client.id);

    // Broadcast leave event
    if (client.taskId) {
      this.broadcastOthers(client, {
        type: 'presence',
        userId: client.userId,
        userName: client.userName,
        taskId: client.taskId,
        timestamp: Date.now(),
        left: true,
      }, client.taskId);
    }
  }

  private sendToClient(client: Client, message: TaskUpdate) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastOthers(sender: Client, message: TaskUpdate, taskId?: string) {
    const targets = taskId
      ? Array.from(this.clients.values()).filter(c => c.taskId === taskId && c.id !== sender.id)
      : Array.from(this.clients.values()).filter(c => c.id !== sender.id);

    for (const client of targets) {
      this.sendToClient(client, message);
    }
  }

  public getConnectedClients(): number {
    return this.clients.size;
  }

  public start() {
    console.log(`WebSocket server started on port ${this.wss.options.port}`);
  }

  public stop() {
    this.wss.close();
    this.clients.clear();
  }
}

// Singleton instance
let server: CollaborativeWebSocketServer | null = null;

/**
 * Start the WebSocket server (call this on server startup)
 */
export function startWebSocketServer(port?: number): CollaborativeWebSocketServer {
  if (!server) {
    server = new CollaborativeWebSocketServer(port);
    server.start();
  }
  return server;
}

/**
 * Get the existing WebSocket server instance
 */
export function getWebSocketServer(): CollaborativeWebSocketServer | null {
  return server;
}

/**
 * Stop the WebSocket server (useful for testing/shutdown)
 */
export function stopWebSocketServer() {
  if (server) {
    server.stop();
    server = null;
  }
}