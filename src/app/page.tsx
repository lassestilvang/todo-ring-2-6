'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import {
  Plus,
  Circle,
  CheckCircle2,
  Trash2,
  Flag,
  Calendar,
  CalendarClock,
  Sparkles,
  Loader2,
  ArrowUpDown,
  ListFilter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/hooks/use-task-store';

// ─── Types ───────────────────────────────────────────────────────────────────
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
  sortOrder: number;
}

// ─── API Helpers ─────────────────────────────────────────────────────────────
async function fetchTasks(view: string, listId?: string | null): Promise<Task[]> {
  const params = new URLSearchParams();
  if (listId && view === 'list') {
    params.set('listId', listId);
  } else {
    params.set('view', view);
  }
  const res = await fetch(`/api/tasks?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch tasks');
  return json.data;
}

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

async function fetchStats() {
  const res = await fetch('/api/stats');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch stats');
  return json.data;
}

// ─── Priority Config ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onToggle,
  onDelete,
  onUpdate,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.deadline && isPast(parseISO(task.deadline)) && task.status !== 'completed';

  const handleDelete = async () => {
    setIsDeleting(true);
    onDelete(task.id);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.8, transition: { duration: 0.2 } }}
      className={cn(
        'group relative flex items-start gap-3 rounded-lg border bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md',
        task.status === 'completed' ? 'opacity-60' : '',
        'border-l-4',
        priority.border || 'border-l-transparent'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 transition-transform duration-200 hover:scale-110 active:scale-95"
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'text-sm font-medium leading-tight transition-all',
          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
        )}>
          {task.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 mt-1.5">

// ─── Quick Add ───────────────────────────────────────────────────────────────
function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task... (⌘K)"
          className="pl-9 pr-20 h-12 text-base bg-card border-dashed focus:border-solid focus:border-primary/50 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>
    </form>
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────
function StatsBar() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 30_000,
  });

  if (!stats) return null;

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="flex items-center gap-4 px-1 py-2 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="font-medium text-foreground">{stats.total}</span> total
      </span>
      <span className="flex items-center gap-1">
        <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.completed}</span> done
      </span>
      <span className="flex items-center gap-1">
        <span className="font-medium text-amber-600 dark:text-amber-400">{stats.pending}</span> pending

// ─── Page Header ─────────────────────────────────────────────────────────────
function PageHeader({ view, listName }: { view: string; listName?: string }) {
  const titles: Record<string, string> = {
    today: 'Today',
    next7: 'Next 7 Days',
    upcoming: 'Upcoming',
    all: 'All Tasks',
    list: listName || 'Tasks',
  };

  const icons: Record<string, React.ReactNode> = {
    today: <Sparkles className="w-5 h-5 text-brand-500" />,
    next7: <CalendarClock className="w-5 h-5 text-brand-500" />,
    upcoming: <ArrowUpDown className="w-5 h-5 text-brand-500" />,
    all: <ListFilter className="w-5 h-5 text-brand-500" />,
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });


// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ view, onAddClick }: { view: string; onAddClick: () => void }) {
  const messages: Record<string, { title: string; desc: string }> = {
    today: { title: 'No tasks for today', desc: 'Enjoy your free day! Or add a task to get started.' },
    next7: { title: 'Nothing coming up', desc: 'Your next 7 days look clear. Add some tasks!' },
    upcoming: { title: 'No upcoming tasks', desc: 'Plan ahead by adding tasks with dates.' },
    all: { title: 'No tasks yet', desc: 'Your task list is empty. Create your first task!' },
    list: { title: 'This list is empty', desc: 'Add tasks to this list to get organized.' },
  };

  const msg = messages[view] || messages.all;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{msg.title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm">{msg.desc}</p>
      <Button onClick={onAddClick} size="sm">
        <Plus className="w-4 h-4 mr-1" /> Add Task
      </Button>

// ─── Task List ───────────────────────────────────────────────────────────────
function TaskList({
  tasks,
  onToggle,
  onDelete,
  onUpdate,
  isLoading,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<Task>) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-muted/50 animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {pendingTasks.length > 0 && (
          <div className="space-y-2">
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle}
                onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-medium">
              {completedTasks.length} completed
            </span>

// ─── Main App ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const queryClient = useQueryClient();
  const {
    activeView,
    activeList,
    searchQuery,
    setTasks,
    setLists,
    setLabels,
    setStats,
  } = useTaskStore();

  // Queries
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeView, activeList],
    queryFn: () => fetchTasks(activeView, activeList),
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });

  // Sync to store for sidebar
  React.useEffect(() => { setTasks(tasks); }, [tasks, setTasks]);
  React.useEffect(() => { setLists(lists); }, [lists, setLists]);
  React.useEffect(() => { setLabels(labels); }, [labels, setLabels]);
  React.useEffect(() => { if (stats) setStats(stats); }, [stats, setStats]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          listId: activeView === 'list' ? activeList : null,
          date: activeView === 'today' ? new Date().toISOString().split('T')[0] : null,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create task');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Task created!');
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const task = tasks.find(t => t.id === id);
      const newStatus = task?.status === 'completed' ? 'pending' : 'completed';
      const res = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to toggle task');
      return json.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (data.status === 'completed') toast('Task completed! 🎉', { icon: '✅' });
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete task');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Task deleted');
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const handleAdd = (title: string) => createMutation.mutate(title);
  const handleToggle = (id: string) => toggleMutation.mutate(id);
  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleUpdate = (id: string, data: Partial<Task>) => {
    queryClient.setQueryData(['tasks', activeView, activeList], (old: Task[] | undefined) =>
      old?.map((t) => (t.id === id ? { ...t, ...data } : t))
    );
  };

  // Filter by search
  const filteredTasks = searchQuery
    ? tasks.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  const listName = activeList
    ? lists.find((l: any) => l.id === activeList)?.name
    : undefined;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <PageHeader view={activeView} listName={listName} />
          <div className="space-y-6">
            <QuickAdd onAdd={handleAdd} />
            {filteredTasks.length === 0 && !isLoading ? (
              <EmptyState view={activeView} onAddClick={() => document.querySelector('input')?.focus()} />
            ) : (
              <TaskList
                tasks={filteredTasks}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

            <div className="h-px flex-1 bg-border" />
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={onToggle}
                  onDelete={onDelete} onUpdate={onUpdate} />
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}

      {pendingTasks.length === 0 && completedTasks.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No tasks to show</p>
      )}
    </div>
  );
}

    </motion.div>
  );
}

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <div className="flex items-center gap-2">
          {icons[view]}
          <h1 className="text-2xl font-bold text-foreground">{titles[view]}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{dateStr}</p>
      </div>
    </div>
  );
}

      </span>
      {stats.overdueCount > 0 && (
        <Badge variant="destructive" className="text-[10px]">{stats.overdueCount} overdue</Badge>
      )}
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }} />
        </div>
        <span className="tabular-nums">{completionRate}%</span>
      </div>
    </div>
  );
}

          {task.priority !== 'none' && (
            <span className={cn('inline-flex items-center gap-1 text-xs font-medium', priority.color)}>
              <priority.icon className="w-3 h-3" />
              {priority.label}
            </span>
          )}
          {task.date && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs',
              isToday(parseISO(task.date)) ? 'text-brand-600 font-medium' : 'text-muted-foreground'
            )}>
              <Calendar className="w-3 h-3" />
              {isToday(parseISO(task.date)) ? 'Today' :
               isTomorrow(parseISO(task.date)) ? 'Tomorrow' :
               format(parseISO(task.date), 'MMM d')}
            </span>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue</Badge>
          )}
          {task.status === 'completed' && task.completedAt && (
            <span className="text-xs text-muted-foreground">
              Done {format(parseISO(task.completedAt), 'MMM d, HH:mm')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="xs" onClick={handleDelete} disabled={isDeleting}
          className="text-muted-foreground hover:text-destructive">
          {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </motion.div>
  );
}

  high: { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-l-red-500', icon: Flag },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-amber-500', icon: Flag },
  low: { label: 'Low', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-l-blue-500', icon: Flag },
  none: { label: '', color: 'text-muted-foreground', bg: '', border: '', icon: null },
} as const;

