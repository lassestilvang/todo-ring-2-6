#!/usr/bin/env node

/**
 * WebSocket Server for Real-time Collaboration
 * Production-ready WebSocket server with health checks and graceful shutdown
 *
 * Run this alongside the Next.js server: node scripts/start-ws-server.js
 *
 * Environment Variables:
 * - WS_PORT: Port to listen on (default: 8080)
 * - WS_HOST: Host to bind to (default: 0.0.0.0)
 * - WS_PATH: WebSocket path (default: /ws)
 * - NODE_ENV: Environment (development/production)
 */

const { WebSocketServer } = require('ws');
const http = require('http');

const PORT = process.env.WS_PORT || 8080;
const HOST = process.env.WS_HOST || '0.0.0.0';
const PATH = process.env.WS_PATH || '/ws';
const ENV = process.env.NODE_ENV || 'development';

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      connections: wss.clients.size,
      timestamp: new Date().toISOString(),
      environment: ENV,
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({
  port: PORT,
  host: HOST,
  path: PATH,
});

// Track connections by task/list for room-based messaging
const rooms = new Map();

console.log(`WebSocket server starting on ${HOST}:${PORT}${PATH}...`);
console.log(`Environment: ${ENV}`);
console.log(`Health check: http://${HOST}:${PORT}/health`);

wss.on('connection', (ws, request) => {
  const url = new URL(request.url || 'ws://localhost', `http://${request.headers.host}`);
  const userId = url.searchParams.get('userId') || 'anonymous';
  const userName = url.searchParams.get('userName') || 'Anonymous User';
  const taskId = url.searchParams.get('taskId');
  const listId = url.searchParams.get('listId');
  const clientId = `${userId}-${Date.now()}`;

  // Store connection metadata
  ws.clientId = clientId;
  ws.userId = userId;
  ws.userName = userName;
  ws.taskId = taskId;
  ws.listId = listId;

  console.log(`Client connected: ${userName} (${userId}) [${clientId}]`);

  // Add to room
  if (taskId) {
    if (!rooms.has(taskId)) rooms.set(taskId, new Set());
    rooms.get(taskId).add(ws);
  }

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    userId,
    userName,
    taskId,
    listId,
    timestamp: new Date().toISOString(),
    connections: wss.clients.size,
  }));

  // Broadcast presence to other clients in same task room
  if (taskId && rooms.has(taskId)) {
    rooms.get(taskId).forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'presence',
          clientId,
          userId,
          userName,
          taskId,
          joined: true,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Handle cursor position updates
      if (message.type === 'cursor_position') {
        message.clientId = clientId;
        message.userId = userId;
        message.userName = userName;
      }

      // Route message to appropriate room
      const roomId = message.taskId || taskId;
      if (roomId && rooms.has(roomId)) {
        rooms.get(roomId).forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      } else {
        // Broadcast to all connections (fallback)
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        });
      }
    } catch (e) {
      console.error('Failed to parse message:', e.message);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${userName} (${userId}) [${clientId}]`);

    // Remove from room
    if (taskId && rooms.has(taskId)) {
      rooms.get(taskId).delete(ws);
      if (rooms.get(taskId).size === 0) {
        rooms.delete(taskId);
      }
    }

    // Notify others about leave
    if (taskId && rooms.has(taskId)) {
      rooms.get(taskId).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'presence',
            clientId,
            userId,
            userName,
            taskId,
            left: true,
            timestamp: new Date().toISOString()
          }));
        }
      });
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for ${userName}:`, error.message);
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error.message);
});

// Health check endpoint
server.listen(PORT + 1, HOST, () => {
  console.log(`Health check server listening on ${HOST}:${PORT + 1}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\nShutting down WebSocket server (${signal})...`);

  // Close all connections
  wss.clients.forEach((ws) => {
    ws.close();
  });

  // Close servers
  wss.close(() => {
    console.log('WebSocket server closed');
  });

  server.close(() => {
    console.log('Health check server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    console.error('Force exit after timeout');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

console.log(`WebSocket server ready. Awaiting connections on port ${PORT}...`);