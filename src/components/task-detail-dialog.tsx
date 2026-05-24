'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Calendar, 
  Flag, 
  AlignLeft, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  Circle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  listId: string | null;
  date: string | null;
  deadline: string | null;
  priority: 'high' | 'medium' | 'low' | 'none';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', icon: Flag },
  medium: { label: 'Medium Priority', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: Flag },
  low: { label: 'Low Priority', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: Flag },
  none: { label: 'No Priority', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Flag },
};

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task?.id, ...data }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update task');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const handleTitleBlur = () => {
    if (task && title !== task.title) {
      updateMutation.mutate({ title });
    }
  };

  const handleDescriptionBlur = () => {
    if (task && description !== task.description) {
      updateMutation.mutate({ description });
    }
  };

  const setPriority = (priority: Task['priority']) => {
    updateMutation.mutate({ priority });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <div className="flex flex-col h-full max-h-[90vh]">
          {/* Header */}
          <div className="p-6 border-b border-border/50 bg-muted/30">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleBlur}
                  className="text-2xl font-black tracking-tight border-none bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/30"
                  placeholder="Task Title"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge variant={task.status === 'completed' ? 'success' : 'outline'} className="rounded-full px-3">
                  {task.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/50 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-brand-500" />
                <span className="font-bold text-muted-foreground/80">
                  {task.date ? format(parseISO(task.date), 'MMM d, yyyy') : 'No date'}
                </span>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm cursor-pointer hover:bg-muted transition-colors",
                PRIORITY_CONFIG[task.priority].bg,
                PRIORITY_CONFIG[task.priority].color,
                "border-current/10"
              )}>
                <Flag className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  {PRIORITY_CONFIG[task.priority].label}
                </span>
              </div>
              {task.completedAt && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-bold text-[10px] uppercase tracking-widest">
                    Done {format(parseISO(task.completedAt), 'MMM d, HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <section>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <AlignLeft className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Description</h4>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a more detailed description..."
                className="w-full min-h-[150px] bg-muted/20 rounded-2xl p-4 text-[15px] leading-relaxed resize-none border-2 border-transparent focus:border-primary/10 focus:bg-muted/40 transition-all outline-none placeholder:text-muted-foreground/40"
              />
            </section>

            <section className="grid grid-cols-2 gap-8">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Flag className="w-4 h-4" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Priority</h4>
                </div>
                <div className="flex flex-col gap-1.5">
                  {(['high', 'medium', 'low', 'none'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all group",
                        task.priority === p 
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Flag className={cn(
                        "w-3.5 h-3.5",
                        task.priority === p ? "text-primary-foreground" : "text-brand-500/50 group-hover:text-brand-500"
                      )} />
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Sparkles className="w-4 h-4" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Quick Actions</h4>
                </div>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start rounded-xl h-10 font-bold border-none bg-muted/50 hover:bg-brand-500/10 hover:text-brand-600">
                    <Calendar className="w-4 h-4 mr-2" /> Change Date
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl h-10 font-bold border-none bg-muted/50 hover:bg-brand-500/10 hover:text-brand-600">
                    <ChevronRight className="w-4 h-4 mr-2" /> Move to List
                  </Button>
                  <Button variant="outline" className="w-full justify-start rounded-xl h-10 font-bold border-none bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Task
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Created {format(parseISO(task.createdAt), 'MMMM d, yyyy')}
            </span>
            <Button onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
