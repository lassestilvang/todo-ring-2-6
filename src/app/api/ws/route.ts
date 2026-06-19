import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// WebSocket endpoint for real-time collaboration
// In production, this would be a dedicated WebSocket server
// For now, we provide configuration for the client to connect

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');
    const listId = url.searchParams.get('listId');
    const userId = url.searchParams.get('userId') || 'anonymous';
    const userName = url.searchParams.get('userName') || 'Anonymous User';

    // Return WebSocket configuration
    return jsonSuccess({
      endpoint: `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'}`,
      taskId,
      listId,
      userId,
      userName,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to connect';
    return jsonError(message, 500, 'WS_ERROR');
  }
}