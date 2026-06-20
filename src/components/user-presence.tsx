'use client';

import * as React from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface UserPresenceProps {
  taskId?: string;
  listId?: string;
  className?: string;
}

export function UserPresence({ taskId, listId, className }: UserPresenceProps) {
  const { connected, usersOnline } = useWebSocket({ taskId, listId });

  if (!usersOnline || usersOnline.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex -space-x-2">
          {usersOnline.slice(0, 5).map((user, index) => (
            <Tooltip key={user.id || index}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={user.avatar || ''} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background',
                    connected ? 'bg-green-500' : 'bg-amber-500'
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent>{user.name}</TooltipContent>
            </Tooltip>
          ))}
          {usersOnline.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-xs font-bold">+{usersOnline.length - 5}</span>
            </div>
          )}
        </div>
        {usersOnline.length > 1 && (
          <Badge variant="secondary" className="text-[10px]">
            {usersOnline.length} online
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}

export function UserPresenceIndicator({ userId }: { userId: string }) {
  const { usersOnline } = useWebSocket({});

  const user = usersOnline.find(u => u.id === userId);

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-xs text-muted-foreground">Online</span>
    </div>
  );
}