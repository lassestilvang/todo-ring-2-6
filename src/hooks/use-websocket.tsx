'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'task_update' | 'task_created' | 'task_deleted' | 'presence_change' | 'typing';
  taskId?: string;
  listId?: string;
  data?: any;
  userId?: string;
  userName?: string;
  users?: string[];
  timestamp?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface UseWebSocketOptions {
  taskId?: string;
  listId?: string;
  onTaskUpdate?: (data: any) => void;
  onTaskCreated?: (data: any) => void;
  onTaskDeleted?: (taskId: string) => void;
  onPresenceChange?: (users: User[]) => void;
  reconnectInterval?: number;
}

export function useWebSocket({
  taskId,
  listId,
  onTaskUpdate,
  onTaskCreated,
  onTaskDeleted,
  onPresenceChange,
  reconnectInterval = 3000,
}: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usersOnline, setUsersOnline] = useState<User[]>([]);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);

      // Join task/list room
      if (taskId) {
        ws.send(JSON.stringify({ type: 'join_task', taskId }));
      }
      if (listId) {
        ws.send(JSON.stringify({ type: 'join_list', listId }));
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('Connection error');
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleMessage(message);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

  }, [taskId, listId]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'task_update':
        onTaskUpdate?.(message.data);
        break;
      case 'task_created':
        onTaskCreated?.(message.data);
        break;
      case 'task_deleted':
        onTaskDeleted?.(message.taskId || '');
        break;
      case 'presence_change':
        const users = (message.users || []).map((name: string, i: number) => ({
          id: message.userId || `user-${i}`,
          name,
          avatar: `https://api.dicebear.com/7.x/initials/svg?name=${encodeURIComponent(name)}`,
        }));
        setUsersOnline(users);
        onPresenceChange?.(users);
        break;
    }
  }, [onTaskUpdate, onTaskCreated, onTaskDeleted, onPresenceChange]);

  useEffect(() => {
    connect();

    // Reconnect logic
    const interval = setInterval(() => {
      if (!connected && wsRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    }, reconnectInterval);

    return () => {
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, [connect, reconnectInterval, connected]);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendTyping = useCallback(() => {
    if (taskId && connected) {
      send({ type: 'typing', taskId, timestamp: new Date().toISOString() });
    }
  }, [taskId, connected, send]);

  return { connected, error, send, sendTyping, usersOnline };
}