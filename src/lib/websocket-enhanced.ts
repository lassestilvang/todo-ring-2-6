/**
 * Enhanced WebSocket Server with Operational Transform for Conflict Resolution
 * Implements OT algorithm for real-time collaborative editing
 */

import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

interface Client {
  id: string;
  userId: string;
  userName: string;
  taskId?: string;
  listId?: string;
  cursor?: { x: number; y: number };
  ws: WebSocket;
}

interface Operation {
  id: string;
  sourceClientId: string;
  type: 'insert' | 'update' | 'delete' | 'move';
  path: string[]; // JSON path to the field
  value?: any;
  position?: number;
  taskId?: string;
  timestamp: number;
}

interface TaskState {
  id: string;
  version: number;
  data: Record<string, any>;
  operations: Operation[];
}

class OperationalTransform {
  /**
   * Transform an operation against another operation
   * Returns the transformed operation
   */
  static transform(op1: Operation, op2: Operation): Operation {
    // If operations are on different paths, no transformation needed
    if (op1.path !== op2.path) {
      return op1;
    }

    // Insert operations
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position !== undefined && op2.position !== undefined) {
        // Adjust position based on op2
        const newOp1 = { ...op1 };
        if (op1.position >= op2.position!) {
          newOp1.position = (op1.position + 1) as any;
        }
        return newOp1;
      }
    }

    // Update operations - no transformation needed for same path
    if (op1.type === 'update' || op1.type === 'delete') {
      return op1;
    }

    // Delete and insert conflict resolution
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position !== undefined && op2.position !== undefined) {
        const newOp1 = { ...op1 };
        if (op1.position > op2.position!) {
          newOp1.position = (op1.position - 1) as any;
        } else if (op1.position === op2.position!) {
          // Position deleted, skip operation
          return { ...op1, position: undefined } as any;
        }
        return newOp1;
      }
    }

    // Move operation conflicts
    if ((op1.type === 'move' || op2.type === 'move') && op1.position !== undefined) {
      return this.resolveMoveConflict(op1, op2);
    }

    return op1;
  }

  /**
   * Resolve move operation conflicts
   */
  private static resolveMoveConflict(op1: Operation, op2: Operation): Operation {
    if (op1.position !== undefined && op2.position !== undefined) {
      // Adjust position based on relative positions
      return op1;
    }
    return op1;
  }

  /**
   * Transform a list of operations against a single operation
   */
  static transformList(operations: Operation[], againstOp: Operation): Operation[] {
    return operations.map(op => this.transform(op, againstOp));
  }

  /**
   * Detect if two operations conflict (would produce different results)
   */
  static hasConflict(op1: Operation, op2: Operation): boolean {
    // Same path indicates potential conflict
    if (JSON.stringify(op1.path) === JSON.stringify(op2.path)) {
      // Different positions in text/array - conflict
      if (op1.position !== undefined && op2.position !== undefined) {
        return op1.position === op2.position;
      }
      // Both are updates to same path
      if (op1.type === 'update' && op2.type === 'update') {
        return true;
      }
    }
    return false;
  }
}

class EnhancedCollaborativeWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private taskStates: Map<string, TaskState> = new Map();
  private pendingOperations: Map<string, Operation[]> = new Map();

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

      const clientId = randomUUID();
      const client: Client = {
        id: clientId,
        userId,
        userName,
        taskId,
        listId,
        ws: request as unknown as WebSocket,
      };

      this.clients.set(clientId, client);

      // Initialize task state if not exists
      if (taskId) {
        if (!this.taskStates.has(taskId)) {
          this.taskStates.set(taskId, {
            id: taskId,
            version: 0,
            data: {},
            operations: [],
          });
        }
      }

      // Send welcome message with current state
      const taskState = taskId ? this.taskStates.get(taskId) : undefined;
      this.sendToClient(client, {
        type: 'connection_established',
        clientId,
        taskState: taskState ? { ...taskState, operations: [] } : undefined,
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
      const message = JSON.parse(data);

      switch (message.type) {
        case 'operation':
          this.handleOperation(client, message);
          break;
        case 'cursor_move':
          this.handleCursorMove(client, message);
          break;
        case 'sync_request':
          this.handleSyncRequest(client, message);
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private handleOperation(client: Client, message: any) {
    const { taskId, operation } = message;
    if (!taskId || !operation) return;

    const taskState = this.taskStates.get(taskId);
    if (!taskState) return;

    // Add source client ID to operation
    operation.sourceClientId = client.id;
    operation.timestamp = Date.now();

    // Transform operation against pending operations
    let transformedOp = operation;
    const pendingOps = this.pendingOperations.get(taskId) || [];

    for (const pendingOp of pendingOps) {
      transformedOp = OperationalTransform.transform(transformedOp, pendingOp);
    }

    // Apply operation
    this.applyOperation(taskId, transformedOp);

    // Broadcast to others
    this.broadcastOthers(client, {
      type: 'operation',
      taskId,
      operation: transformedOp,
    }, taskId);

    // Add to pending operations
    if (!this.pendingOperations.has(taskId)) {
      this.pendingOperations.set(taskId, []);
    }
    this.pendingOperations.get(taskId)!.push(transformedOp);

    // Clean up old pending operations (keep last 100)
    const ops = this.pendingOperations.get(taskId)!;
    if (ops.length > 100) {
      this.pendingOperations.set(taskId, ops.slice(-100));
    }
  }

  private async applyOperation(taskId: string, operation: Operation) {
    const taskState = this.taskStates.get(taskId);
    if (!taskState) return;

    // Conflict detection and resolution
    const pendingOps = this.pendingOperations.get(taskId) || [];
    const conflictingOps = pendingOps.filter(op => OperationalTransform.hasConflict(operation, op));
    if (conflictingOps.length > 0) {
      // Notify client about conflicts
      this.sendToClient({ id: operation.sourceClientId, userId: '', userName: '', ws: {} as any }, {
        type: 'conflict_detected',
        taskId,
        conflictingOperations: conflictingOps,
        timestamp: Date.now(),
      });
    }

    // Update task data based on operation
    switch (operation.type) {
      case 'insert':
        if (operation.position !== undefined && operation.value !== undefined) {
          const arr = operation.path.reduce((obj, key) => obj[key], taskState.data) || [];
          arr.splice(operation.position, 0, operation.value);
        }
        break;
      case 'update':
        if (operation.value !== undefined) {
          const obj = operation.path.reduce((obj, key) => obj[key], taskState.data);
          if (obj) {
            obj[operation.path[operation.path.length - 1]] = operation.value;
          }
        }
        break;
      case 'delete':
        if (operation.position !== undefined) {
          const arr = operation.path.reduce((obj, key) => obj[key], taskState.data) || [];
          arr.splice(operation.position, 1);
        }
        break;
      case 'move':
        // Handle move operations for task reordering
        if (operation.position !== undefined && operation.value !== undefined) {
          const arr = operation.path.reduce((obj, key) => obj[key], taskState.data) || [];
          const [moved] = arr.splice(operation.position, 1);
          arr.push(moved);
        }
        break;
    }

    // Record version history
    try {
      const { getTaskHistoryRepository } = await import('./repositories/task-history-repository');
      const historyRepo = getTaskHistoryRepository();
      const latestVersion = historyRepo.getLatestVersion(taskId);
      historyRepo.recordVersion({
        taskId,
        version: latestVersion + 1,
        operation: {
          type: operation.type,
          path: operation.path,
          value: operation.value,
          position: operation.position,
        },
        performedBy: this.getClientById(operation.sourceClientId)?.userId || 'unknown',
        performedByName: this.getClientById(operation.sourceClientId)?.userName || 'Unknown',
      });
    } catch (error) {
      console.error('Failed to record version history:', error);
    }

    taskState.version++;
    taskState.operations.push(operation);
  }

  /**
   * Get client by ID
   */
  private getClientById(clientId: string): Client | undefined {
    return Array.from(this.clients.values()).find(c => c.id === clientId);
  }

  private handleCursorMove(client: Client, message: any) {
    client.cursor = message.cursor;
    this.broadcastOthers(client, message, message.taskId);
  }

  private handleSyncRequest(client: Client, message: any) {
    const { taskId } = message;
    if (!taskId) return;

    const taskState = this.taskStates.get(taskId);
    if (taskState) {
      this.sendToClient(client, {
        type: 'sync_response',
        taskId,
        state: { ...taskState, operations: [] },
      });
    }
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
        status: 'offline',
      }, client.taskId);
    }
  }

  private sendToClient(client: Client, message: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcastOthers(sender: Client, message: any, taskId?: string) {
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
    console.log(`Enhanced WebSocket server started on port ${this.wss.options.port}`);
  }

  public stop() {
    this.wss.close();
    this.clients.clear();
    this.taskStates.clear();
    this.pendingOperations.clear();
  }
}

// Singleton instance
let server: EnhancedCollaborativeWebSocketServer | null = null;

export function startWebSocketServer(port?: number): EnhancedCollaborativeWebSocketServer {
  if (!server) {
    server = new EnhancedCollaborativeWebSocketServer(port);
    server.start();
  }
  return server;
}

export function getWebSocketServer(): EnhancedCollaborativeWebSocketServer | null {
  return server;
}

export function stopWebSocketServer() {
  if (server) {
    server.stop();
    server = null;
  }
}