'use client';

import * as React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Flag,
  AlignLeft,
  Clock,
  CheckCircle2,
  Circle,
  ChevronRight,
  Sparkles,
  Plus,
  GripVertical,
  Play,
  Tag,
  Link,
  History,
  Share2,
  AlertCircle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { TaskComments } from '@/components/task-comments';
import { ShareDialog } from '@/components/share-dialog';
import { TaskAttachments } from '@/components/task-attachments';
import { TaskHistory } from '@/components/task-history';
import { TaskDependencies } from '@/components/task-dependencies';
import { useWebSocket } from '@/hooks/use-websocket';
import type { Task, Subtask, List, Label } from '@/types/index';

const PRIORITY_CONFIG = {
  high: { label: 'High Priority', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', icon: Flag },
  medium: { label: 'Medium Priority', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', icon: Flag },
  low: { label: 'Low Priority', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-amber-950/30', icon: Flag },
  none: { label: 'No Priority', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Flag },
};

const RECURRING_OPTIONS = [
  { value: 'none', label: 'No recurrence' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

async function fetchLists() {
  const res = await fetch('/api/lists');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch lists');
  return json.data;
}

async function fetchLabels() {
  const res = await fetch('/api/labels');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch labels');
  return json.data;
}

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
  const [localSubtasks, setLocalSubtasks] = React.useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = React.useState('');
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [timerStart, setTimerStart] = React.useState<Date | null>(null);
  const [selectedLabels, setSelectedLabels] = React.useState<Label[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  const [usersOnline, setUsersOnline] = React.useState<string[]>([]);

  // WebSocket for real-time updates
  const { connected } = useWebSocket({
    taskId: task?.id,
    onTaskUpdate: (data) => {
      // Update local state with real-time changes
      if (data.title) setTitle(data.title);
      if (data.description !== undefined) setDescription(data.description);
    },
    onPresenceChange: (users) => setUsersOnline(users),
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

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

  const createSubtaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/subtasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task?.id, title }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create subtask');
      return json.data;
    },
    onSuccess: (newSubtask: Subtask) => {
      setLocalSubtasks(prev => [...prev, newSubtask]);
      queryClient.invalidateQueries({ queryKey: ['tasks', task?.id] });
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/subtasks?id=${id}`, { method: 'DELETE' });
      return id;
    },
    onSuccess: (deletedId: string) => {
      setLocalSubtasks(prev => prev.filter(s => s.id !== deletedId));
      queryClient.invalidateQueries({ queryKey: ['tasks', task?.id] });
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/subtasks?id=${id}`, { method: 'PUT' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to toggle subtask');
      return json.data;
    },
    onSuccess: (updated: Subtask) => {
      setLocalSubtasks(prev => prev.map(s => s.id === updated.id ? updated : s));
      queryClient.invalidateQueries({ queryKey: ['tasks', task?.id] });
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  React.useEffect(() => {
    if (task && open) {
      // Load subtasks
      fetch(`/api/subtasks?taskId=${task.id}`)
        .then(r => r.json())
        .then(json => {
          if (json.success) setLocalSubtasks(json.data);
        })
        .catch(() => setLocalSubtasks([]));

      // Load task labels
      fetch(`/api/labels?taskId=${task.id}`)
        .then(r => r.json())
        .then(json => {
          if (json.success) setSelectedLabels(json.data);
        })
        .catch(() => setSelectedLabels([]));
    }
  }, [task, open]);

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

  const handleAddSubtask = () => {
    if (!newSubtask.trim() || !task) return;
    createSubtaskMutation.mutate(newSubtask.trim());
    setNewSubtask('');
  };

  const handleDeleteSubtask = (id: string) => {
    deleteSubtaskMutation.mutate(id);
  };

  const handleToggleSubtask = (id: string) => {
    toggleSubtaskMutation.mutate(id);
  };

  const handleTimeTrack = () => {
    if (!task) return;
    if (isTimerRunning && timerStart) {
      const elapsed = Math.round((Date.now() - timerStart.getTime()) / 60000);
      const totalMinutes = (task.actualHours || 0) * 60 + (task.actualMinutes || 0) + elapsed;
      updateMutation.mutate({
        actualHours: Math.floor(totalMinutes / 60),
        actualMinutes: totalMinutes % 60,
      });
      setIsTimerRunning(false);
      setTimerStart(null);
    } else {
      setIsTimerRunning(true);
      setTimerStart(new Date());
    }
  };

  if (!task) return null;

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

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
                {connected && usersOnline.length > 0 && (
                  <div className="flex -space-x-2">
                    {usersOnline.slice(0, 3).map((user, i) => (
                      <div key={i} className="w-6 h-6 rounded-full bg-brand-500/20 border-2 border-card flex items-center justify-center">
                        <span className="text-xs font-bold text-brand-500">{user[0]}</span>
                      </div>
                    ))}
                    {usersOnline.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                        <span className="text-xs font-bold">+{usersOnline.length - 3}</span>
                      </div>
                    )}
                  </div>
                )}
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
              {task.deadline && (
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm",
                  isOverdue ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-muted/50 text-muted-foreground"
                )}>
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-bold uppercase tracking-widest text-[10px]">
                    Due {format(parseISO(task.deadline), 'MMM d')}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-2 ml-1">Overdue</Badge>
                  )}
                </div>
              )}
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

            {/* Subtasks */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Circle className="w-4 h-4" />
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Subtasks ({localSubtasks.length})</h4>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    placeholder="Add a subtask..."
                    className="flex-1 h-9 rounded-xl bg-muted/20 border-none text-sm"
                  />
                  <Button
                    onClick={handleAddSubtask}
                    disabled={!newSubtask.trim() || !task}
                    className="h-9 w-9 p-0 rounded-xl"
                    size="icon"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {localSubtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 px-2 py-1.5 bg-muted/20 rounded-xl">
                      <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-move" />
                      <button
                        onClick={() => handleToggleSubtask(subtask.id)}
                        className="flex-1 text-left text-sm hover:opacity-80"
                      >
                        {subtask.isCompleted ? (
                          <span className="line-through text-muted-foreground/60">{subtask.title}</span>
                        ) : (
                          <span>{subtask.title}</span>
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
                      >
                        <ChevronRight className="w-3 h-3 rotate-180" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Time Tracking */}
            <section>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Time Tracking</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Estimated</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      value={task.estimateHours || 0}
                      onChange={(e) => updateMutation.mutate({ estimateHours: parseInt(e.target.value) || 0 })}
                      className="w-16 h-8 text-sm font-bold text-center"
                    />
                    <span className="text-sm font-medium">h</span>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={task.estimateMinutes || 0}
                      onChange={(e) => updateMutation.mutate({ estimateMinutes: parseInt(e.target.value) || 0 })}
                      className="w-16 h-8 text-sm font-bold text-center"
                    />
                    <span className="text-sm font-medium">m</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actual</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{Math.floor((task.actualHours || 0) + (task.actualMinutes || 0) / 60)}h {(task.actualMinutes || 0) % 60}m</span>
                      <Button
                        onClick={handleTimeTrack}
                        variant={isTimerRunning ? "destructive" : "outline"}
                        size="sm"
                        className="h-7 px-2"
                      >
                        {isTimerRunning ? <ChevronRight className="w-3 h-3 rotate-90" /> : <Play className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
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
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Actions</h4>
                </div>
                <div className="space-y-3">
                  <Input
                    type="date"
                    value={task.date || ''}
                    onChange={(e) => updateMutation.mutate({ date: e.target.value || null })}
                    className="w-full h-10 rounded-xl bg-muted/50 border-none font-bold"
                  />
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {lists.map((list: List) => (
                      <button
                        key={list.id}
                        onClick={() => updateMutation.mutate({ listId: list.id })}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <span className="text-base mr-2">{list.emoji}</span>
                        <span className="truncate">{list.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground/60">
                    Created {format(parseISO(task.createdAt), 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>
            </section>

            {/* Recurring */}
            <section>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Recurring</h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {RECURRING_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={task.recurringType === opt.value ? "default" : "outline"}
                    onClick={() => updateMutation.mutate({ recurringType: opt.value as any })}
                    className="h-9 text-sm font-medium"
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </section>

            {/* Reminders */}
            <section>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Reminders</h4>
              </div>
              <div className="space-y-3">
                <Input
                  type="datetime-local"
                  value={task.reminderTime ? task.reminderTime.slice(0, 16) : ''}
                  onChange={(e) => updateMutation.mutate({ reminderTime: e.target.value || null })}
                  className="w-full h-10 rounded-xl bg-muted/50 border-none font-bold"
                />
                {task.reminderTime && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateMutation.mutate({ reminderTime: null })}
                    className="w-full"
                  >
                    Clear Reminder
                  </Button>
                )}
              </div>
            </section>

            {/* Labels */}
            <section>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Tag className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Labels</h4>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {labels.map((label: Label) => {
                    const isSelected = selectedLabels.some(l => l.id === label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => {
                          const newLabels = isSelected
                            ? selectedLabels.filter(l => l.id !== label.id)
                            : [...selectedLabels, label];
                          setSelectedLabels(newLabels);
                          // Update task labels
                          if (isSelected) {
                            fetch(`/api/labels`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'remove', taskId: task.id, labelId: label.id }),
                            });
                          } else {
                            fetch(`/api/labels`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'assign', taskId: task.id, labelId: label.id }),
                            });
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                          isSelected
                            ? "ring-2 ring-offset-2 ring-primary bg-primary/10"
                            : "bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span style={{ color: label.color }}>{label.icon}</span>
                          {label.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Dependencies */}
            <TaskDependencies taskId={task.id} />

            {/* Task History */}
            <section>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <History className="w-4 h-4" />
                <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Activity History</h4>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <TaskHistory taskId={task.id} open={true} />
              </div>
            </section>

            {/* Comments */}
            <TaskComments taskId={task.id} />

            {/* Attachments */}
            <TaskAttachments taskId={task.id} />

            {/* Share Button */}
            <div className="pt-4 border-t border-border/50">
              <Button
                variant="outline"
                onClick={() => setIsShareDialogOpen(true)}
                className="w-full"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Task
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
              Task Details
            </span>
            <Button onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-black uppercase tracking-tighter shadow-lg shadow-primary/20">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Share Dialog */}
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        taskId={task.id}
        type="task"
      />
    </Dialog>
  );
}