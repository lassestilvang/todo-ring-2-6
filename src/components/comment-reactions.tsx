'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Smile, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CommentReaction {
  id: string;
  commentId: string;
  userId: string;
  userName: string;
  emoji: string;
  createdAt: string;
}

interface CommentReactionsProps {
  commentId: string;
  userId: string;
  userName: string;
  className?: string;
}

// Common emoji reactions
const REACTIONS = ['👍', '👎', '❤️', '😮', '😢', '😄', '🎉', '🔥', '✅', '🚀'];

export function CommentReactions({ commentId, userId, userName, className }: CommentReactionsProps) {
  const queryClient = useQueryClient();

  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['comment-reactions', commentId],
    queryFn: async () => {
      const res = await fetch(`/api/comments/${commentId}/reactions`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const res = await fetch(`/api/comments/${commentId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId, userName }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to add reaction');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comment-reactions', commentId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Group reactions by emoji
  const reactionCounts = React.useMemo(() => {
    const counts = new Map<string, { count: number; hasUserReacted: boolean }>();
    reactions.forEach((r: CommentReaction) => {
      const existing = counts.get(r.emoji) || { count: 0, hasUserReacted: false };
      counts.set(r.emoji, {
        count: existing.count + 1,
        hasUserReacted: r.userId === userId || existing.hasUserReacted,
      });
    });
    return counts;
  }, [reactions, userId]);

  const handleAddReaction = (emoji: string) => {
    addMutation.mutate(emoji);
  };

  if (isLoading) {
    return <div className="h-6" />;
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Reaction summary */}
      <div className="flex items-center gap-1">
        {Array.from(reactionCounts.entries()).map(([emoji, data]) => (
          <button
            key={emoji}
            onClick={() => handleAddReaction(emoji)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all",
              data.hasUserReacted
                ? "bg-primary/20 text-primary"
                : "bg-muted/50 hover:bg-muted/80"
            )}
            title={reactions
              .filter(r => r.emoji === emoji)
              .map(r => r.userName)
              .join(', ')}
          >
            <span>{emoji}</span>
            <span>{data.count}</span>
          </button>
        ))}
      </div>

      {/* Add reaction button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            title="Add reaction"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <div className="flex items-center gap-1">
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleAddReaction(emoji)}
                className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-muted/50"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Reaction filter dropdown
interface ReactionFilterProps {
  commentId: string;
  reactions: CommentReaction[];
  onFilter: (emoji: string | null) => void;
}

export function ReactionFilter({ commentId, reactions, onFilter }: ReactionFilterProps) {
  const uniqueReactions = Array.from(new Set(reactions.map(r => r.emoji)));

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Filter:</span>
      <button
        onClick={() => onFilter(null)}
        className="px-2 py-1 rounded bg-muted/50 hover:bg-muted/80"
      >
        All
      </button>
      {uniqueReactions.map(emoji => (
        <button
          key={emoji}
          onClick={() => onFilter(emoji)}
          className="px-2 py-1 rounded bg-muted/50 hover:bg-muted/80"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}