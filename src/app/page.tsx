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

async function fetchStats() {
  const res = await fetch('/api/stats');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch stats');
  return json.data;
}

// ─── Priority Config ─────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-l-red-500', icon: Flag },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-l-amber-500', icon: Flag },
  low: { label: 'Low', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-l-blue-500', icon: Flag },
  none: { label: '', color: 'text-muted-foreground', bg: '', border: '', icon: null },
} as const;

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
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileHover={{ y: -2 }}
      className={cn(
        'group relative flex items-start gap-4 rounded-xl border bg-card p-4 transition-all duration-300',
        'hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]',
        'hover:border-primary/20',
        task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : '',
        'border-l-[6px]',
        priority.border || 'border-l-transparent'
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="mt-0.5 flex-shrink-0 transition-all duration-300 hover:scale-110 active:scale-90"
      >
        {task.status === 'completed' ? (
          <div className="relative">
            <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-50 dark:fill-emerald-950/30" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute inset-0 rounded-full bg-emerald-500/20 -z-10"
            />
          </div>
        ) : (
          <Circle className="w-6 h-6 text-muted-foreground/30 hover:text-primary/50 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className={cn(
          'text-[15px] font-semibold tracking-tight leading-snug transition-all duration-300',
          task.status === 'completed' ? 'line-through text-muted-foreground/70' : 'text-foreground/90'
        )}>
          {task.title}
        </h3>

        <div className="flex flex-wrap items-center gap-3 mt-2">
          {task.priority !== 'none' && (
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider',
              priority.bg,
              priority.color
            )}>
              <priority.icon className="w-3 h-3" />
              {priority.label}
            </span>
          )}
          {task.date && (
            <span className={cn(
              'inline-flex items-center gap-1.5 text-[12px]',
              isToday(parseISO(task.date)) ? 'text-brand-600 font-semibold' : 'text-muted-foreground/80'
            )}>
              <Calendar className="w-3.5 h-3.5" />
              {isToday(parseISO(task.date)) ? 'Today' :
               isTomorrow(parseISO(task.date)) ? 'Tomorrow' :
               format(parseISO(task.date), 'MMM d')}
            </span>
          )}
          {isOverdue && (
            <Badge variant="destructive" className="text-[10px] h-5 px-2 rounded-md font-bold uppercase tracking-tighter">
              Overdue
            </Badge>
          )}
          {task.status === 'completed' && task.completedAt && (
            <span className="text-[11px] text-muted-foreground/60 font-medium italic">
              Done {format(parseISO(task.completedAt), 'MMM d, HH:mm')}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Quick Add ───────────────────────────────────────────────────────────────
function QuickAdd({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
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
    <form onSubmit={handleSubmit} className="relative group">
      <motion.div
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        className="relative"
      >
        <div className={cn(
          "absolute inset-0 bg-primary/5 rounded-xl blur-xl transition-opacity duration-500",
          isFocused ? "opacity-100" : "opacity-0"
        )} />
        <Plus className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300",
          isFocused ? "text-primary" : "text-muted-foreground/40"
        )} />
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What needs to be done? (⌘K)"
          className={cn(
            "pl-12 pr-24 h-14 text-base rounded-xl bg-card/50 backdrop-blur-sm border-2 border-dashed transition-all duration-500",
            isFocused ? "border-primary/50 border-solid shadow-lg bg-card" : "border-muted-foreground/10 hover:border-muted-foreground/20"
          )}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
            ⌘K
          </kbd>
        </div>
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-6 px-4 py-3 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-sm mb-8"
    >
      <div className="flex items-center gap-4">
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 transform -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              className="text-muted/30"
            />
            <motion.circle
              cx="20"
              cy="20"
              r="18"
              stroke="currentColor"
              strokeWidth="3"
              fill="transparent"
              strokeDasharray={113.1}
              initial={{ strokeDashoffset: 113.1 }}
              animate={{ strokeDashoffset: 113.1 - (113.1 * completionRate) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-brand-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
            {completionRate}%
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Progress</p>
          <p className="text-sm font-bold text-foreground">{stats.completed} / {stats.total} Tasks</p>
        </div>
      </div>

      <div className="h-8 w-px bg-border/50" />

      <div className="flex-1 flex items-center gap-8">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Pending</p>
          <p className="text-sm font-bold text-amber-500 tabular-nums">{stats.pending}</p>
        </div>
        {stats.overdueCount > 0 && (
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Overdue</p>
            <p className="text-sm font-bold text-destructive tabular-nums">{stats.overdueCount}</p>
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-brand-500/50" />
            </div>
          ))}
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Team</span>
      </div>
    </motion.div>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────
function PageHeader({ view, listName }: { view: string; listName?: string }) {
  const titles: Record<string, string> = {
    today: 'Daily Focus',
    next7: 'Next 7 Days',
    upcoming: 'Future Plans',
    all: 'All Tasks',
    list: listName || 'Tasks',
  };

  const icons: Record<string, React.ReactNode> = {
    today: <Sparkles className="w-8 h-8 text-brand-500" />,
    next7: <CalendarClock className="w-8 h-8 text-brand-500" />,
    upcoming: <ArrowUpDown className="w-8 h-8 text-brand-500" />,
    all: <ListFilter className="w-8 h-8 text-brand-500" />,
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 shadow-inner"
          >
            {icons[view] || <ListFilter className="w-6 h-6 text-brand-500" />}
          </motion.div>
          <div>
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-3xl font-black tracking-tight text-foreground"
            >
              {titles[view]}
            </motion.h1>
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm font-medium text-muted-foreground/80 flex items-center gap-2 mt-0.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
            </motion.p>
          </div>
        </div>
      </div>
      <StatsBar />
    </div>
  );
}

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
      className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6 shadow-inner">
        <Sparkles className="w-10 h-10 text-muted-foreground/20" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{msg.title}</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">{msg.desc}</p>
      <Button onClick={onAddClick} size="lg" className="rounded-xl px-8 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
        <Plus className="w-5 h-5 mr-2" /> Add Your First Task
      </Button>
    </motion.div>
  );
}

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
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse border border-border/50"
            style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    );
  }

  const pendingTasks = tasks.filter((t) => t.status !== 'completed');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-10">
      <AnimatePresence mode="popLayout">
        {pendingTasks.length > 0 && (
          <div className="space-y-3">
            {pendingTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle}
                onDelete={onDelete} onUpdate={onUpdate} />
            ))}
          </div>
        )}
      </AnimatePresence>

      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              {completedTasks.length} Completed
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={onToggle}
                  onDelete={onDelete} onUpdate={onUpdate} />
              ))}
            </div>
          </AnimatePresence>
        </div>
      )}

      {pendingTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground font-medium italic">No tasks found for this view</p>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const queryClient = useQueryClient();
  const {
    activeView,
    activeList,
    searchQuery,
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
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', activeView, activeList] });
      const previousTasks = queryClient.getQueryData(['tasks', activeView, activeList]);
      
      queryClient.setQueryData(['tasks', activeView, activeList], (old: Task[] | undefined) => {
        return old?.map(t => {
          if (t.id === id) {
            const isNowCompleted = t.status !== 'completed';
            return {
              ...t,
              status: isNowCompleted ? 'completed' : 'pending',
              completedAt: isNowCompleted ? new Date().toISOString() : null,
            };
          }
          return t;
        });
      });
      
      return { previousTasks };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      if (data.status === 'completed') toast('Task completed! 🎉', { icon: '✅' });
    },
    onError: (err: Error, id, context) => {
      queryClient.setQueryData(['tasks', activeView, activeList], context?.previousTasks);
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete task');
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['tasks', activeView, activeList] });
      const previousTasks = queryClient.getQueryData(['tasks', activeView, activeList]);
      
      queryClient.setQueryData(['tasks', activeView, activeList], (old: Task[] | undefined) => {
        return old?.filter(t => t.id !== id);
      });
      
      return { previousTasks };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast.success('Task deleted');
    },
    onError: (err: Error, id, context) => {
      queryClient.setQueryData(['tasks', activeView, activeList], context?.previousTasks);
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
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
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <PageHeader view={activeView} listName={listName} />
          <div className="space-y-10">
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
