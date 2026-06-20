'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, User, AtSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface TaskCommentsProps {
  taskId: string;
}

interface Comment {
  id: string;
  taskId: string;
  parentId: string | null;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

// Parse mentions from content
function parseMentions(content: string): { text: string; mentions: string[] } {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let text = content;

  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return { text, mentions };
}

// Highlight mentions in text
function CommentWithMentions({ content }: { content: string }) {
  const { text, mentions } = parseMentions(content);
  const parts = text.split(/@(\w+)/g);

  return (
    <p className="text-sm">
      {parts.map((part, i) => {
        if (mentions.includes(part)) {
          return (
            <span key={i} className="bg-blue-500/20 text-blue-600 rounded px-1 text-xs font-medium">
              @{part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newComment, setNewComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fetch comments
  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async (): Promise<Comment[]> => {
      const res = await fetch(`/api/comments?taskId=${taskId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to fetch comments');
      return json.data;
    },
    enabled: !!taskId,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          userId: user?.id,
          userName: user?.name,
          content,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to add comment');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', taskId] });
      setNewComment('');
    },
  });

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;
    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync(newComment);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">
            Comments ({comments.length})
          </h4>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted/40" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/40 rounded w-3/4" />
                  <div className="h-3 bg-muted/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground/60">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No comments yet. Be the first to discuss!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold">
                {comment.userName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="font-semibold">{comment.userName}</span>
                  <span className="text-muted-foreground/60">
                    {new Date(comment.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <CommentWithMentions content={comment.content} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add comment */}
      <div className="flex items-center gap-2">
        <AtSign className="w-4 h-4 text-muted-foreground/50" />
        <Input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          placeholder="Mention someone with @name..."
          className="flex-1 h-9 text-sm"
          disabled={isSubmitting}
        />
        <Button
          size="sm"
          onClick={handleAddComment}
          disabled={!newComment.trim() || isSubmitting}
          className="h-9 w-9 p-0"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Help text */}
      <p className="text-[10px] text-muted-foreground/60 mt-2">
        Tip: Use @ to mention teammates and notify them
      </p>
    </section>
  );
}