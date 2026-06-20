'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
  '#06B6D4', '#14B8A0', '#F97316', '#84CC16', '#FCD34D', '#A78BFA',
];

interface LabelCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LabelCreateDialog({ open, onOpenChange }: LabelCreateDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = React.useState<string>('🏷');

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; color: string; icon?: string }) => {
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, color: data.color, icon: data.icon ?? '🏷' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create label');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success('Label created!');
      onOpenChange(false);
      setName('');
      setSelectedColor(COLORS[0]);
      setSelectedIcon('🏷' as any);
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), color: selectedColor, icon: selectedIcon } as { name: string; color: string; icon: string });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            Create Label
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60 font-medium">
            Create a new label to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Label name (e.g. Work, Personal)"
              className="h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-bold text-lg"
              autoFocus
            />

            <div>
              <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
                Choose Color
              </p>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all hover:scale-110 active:scale-95 ring-2 ring-transparent",
                      selectedColor === color ? "ring-2 ring-white scale-110" : "hover:opacity-80"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
                Choose Icon
              </p>
              <div className="grid grid-cols-6 gap-2">
                {['🏷', '⭐', '🔥', '💼', '🏠', '🎯', '✅', '🚀', '💡', '📅', '🎨', '🎵'].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setSelectedIcon(icon as any)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-xl transition-all hover:scale-110 active:scale-95",
                      selectedIcon === icon ? "bg-primary text-primary-foreground scale-105" : "bg-muted/30 hover:bg-muted"
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!name.trim() || createMutation.isPending}
              className="w-full h-12 rounded-xl font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Label'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}