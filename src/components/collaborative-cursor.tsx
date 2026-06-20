'use client';

import * as React from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { cn } from '@/lib/utils';

interface CursorPosition {
  userId: string;
  userName: string;
  userAvatar?: string;
  x: number;
  y: number;
  selection?: { start: number; end: number };
}

interface CollaborativeCursorProps {
  taskId?: string;
  className?: string;
}

export function CollaborativeCursor({ taskId, className }: CollaborativeCursorProps) {
  const { connected } = useWebSocket({ taskId });
  const [cursors, setCursors] = React.useState<CursorPosition[]>([]);

  // This would receive cursor positions from WebSocket
  // For now, we'll show a placeholder since the infrastructure exists
  React.useEffect(() => {
    if (!connected) {
      setCursors([]);
    }
  }, [connected]);

  if (!connected || cursors.length === 0) {
    return null;
  }

  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {cursors.map((cursor) => (
        <div
          key={cursor.userId}
          className="absolute flex items-center justify-center"
          style={{ left: cursor.x, top: cursor.y }}
        >
          <div className="flex items-center gap-1 bg-popover border rounded-full px-2 py-1 shadow-lg">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{cursor.userAvatar || cursor.userName[0]}</span>
            </div>
            <span className="text-xs font-medium">{cursor.userName}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CollaborativeSelection({ taskId }: { taskId: string }) {
  const { connected } = useWebSocket({ taskId });
  const [selections, setSelections] = React.useState<Map<string, string>>(new Map());

  // Infrastructure for selection tracking exists
  // This would show other users' selected text ranges

  if (!connected || selections.size === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from(selections.entries()).map(([userId, text]) => (
        <div key={userId} className="absolute bg-primary/20 rounded px-1 py-0.5">
          <span className="text-xs">{text}</span>
        </div>
      ))}
    </div>
  );
}