'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

const EMOJIS = ['📝', '🏠', '💼', '🛒', '🏋️', '📚', '🎨', '✈️', '🎸', '🍎'];

export function ListCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [emoji, setEmoji] = React.useState(EMOJIS[0]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; emoji: string }) => {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create list');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      toast.success('List created!');
      onOpenChange(false);
      setName('');
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), emoji });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            Create New List
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60 font-medium">
            Organize your tasks by creating a dedicated list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-2xl shadow-inner">
                {emoji}
              </div>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List Name (e.g. Work, Groceries)"
                className="flex-1 h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-bold text-lg"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-5 gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={cn(
                    "h-12 rounded-xl text-xl transition-all hover:scale-110 active:scale-95",
                    emoji === e ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" : "bg-muted/30 hover:bg-muted"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="submit" 
              disabled={!name.trim() || createMutation.isPending}
              className="w-full h-12 rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
            >
              {createMutation.isPending ? 'Creating...' : 'Create List'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
