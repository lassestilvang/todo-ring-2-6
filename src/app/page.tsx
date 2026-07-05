'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { parseNaturalLanguage } from '@/lib/nlp';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  GripVertical,
  Clock,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  BarChart3,
  Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyStateIllustration } from '@/components/empty-state-illustration';
import { cn } from '@/lib/utils';
import { getTaskAging } from '@/lib/task-utils';
import { useTaskStore } from '@/hooks/use-task-store';
import { TaskDetailDialog } from '@/components/task-detail-dialog';
import { KanbanBoard } from '@/components/kanban-board';
import { CalendarView } from '@/components/calendar-view';
import { GanttChart } from '@/components/gantt-chart';
import { TaskFilter } from '@/components/task-filter';
import { TaskTemplates } from '@/components/task-templates';
import { BulkActions } from '@/components/bulk-actions';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { OnboardingWelcome } from '@/components/onboarding-welcome';
import { KeyboardShortcutHelp } from '@/components/keyboard-shortcut-help';
import { PWAPrompt } from '@/components/pwa-install-prompt';
import { FocusMode } from '@/components/focus-mode';
import { QuickStats } from '@/components/quick-stats';
import { GoalTracker } from '@/components/goal-tracker';
import { HabitTracker } from '@/components/habit-tracker';
import { AIAssistant } from '@/components/ai-assistant';
import type { Task, List } from '@/types/index';

// ─── API Helpers ─────────────────────────────────────────────────────────────
async function fetchTasks(view: string, listId?: string | null, labelId?: string | null, filters?: {
  priorities?: ('high' | 'medium' | 'low' | 'none')[];
  statuses?: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
  labels?: string[];
  dateFrom?: string;
  dateTo?: string;
  minEstimate?: string;
  maxEstimate?: string;
}): Promise<Task[]> {
  const params = new URLSearchParams();
  if (labelId && view === 'label') {
    params.set('labelId', labelId);
  } else if (listId && view === 'list') {
    params.set('listId', listId);
  } else {
    params.set('view', view);
  }
  // Add filter parameters
  if (filters) {
    if (filters.priorities && filters.priorities.length > 0) {
      params.set('priorities', filters.priorities.join(','));
    }
    if (filters.statuses && filters.statuses.length > 0) {
      params.set('statuses', filters.statuses.join(','));
    }
    if (filters.labels && filters.labels.length > 0) {
      params.set('labels', filters.labels.join(','));
    }
    if (filters.dateFrom) {
      params.set('dateFrom', filters.dateFrom);
    }
    if (filters.dateTo) {
      params.set('dateTo', filters.dateTo);
    }
    if (filters.minEstimate) {
      params.set('minEstimate', filters.minEstimate);
    }
    if (filters.maxEstimate) {
      params.set('maxEstimate', filters.maxEstimate);
    }
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

// ─── Sortable Task Card ────────────────────────────────────────────────────────
function SortableTaskCard({
  task,
  onToggle,
  onDelete,
  onSelect,
  isSelected,
  selectionMode,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (task: Task) => void;
  isSelected?: boolean;
  selectionMode?: boolean;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.deadline && isPast(parseISO(task.deadline)) && task.status !== 'completed';
  const aging = getTaskAging(task);

  // Get age indicator
  const getAgeIndicator = () => {
    if (aging.ageDays <= 2) return null;
    if (aging.ageDays <= 7) return { label: 'New', color: 'text-emerald-600' };
    if (aging.ageDays <= 30) return null;
    if (aging.ageDays <= 90) return { label: 'Old', color: 'text-amber-600' };
    return { label: 'Stale', color: 'text-red-600' };
  };

  const ageIndicator = getAgeIndicator();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    onDelete(task.id);
  };

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileHover={{ y: -2 }}
      onClick={() => !selectionMode && onSelect(task)}
      className={cn(
        'group relative flex items-start gap-4 rounded-xl border bg-card/60 backdrop-blur-sm p-4 transition-all duration-300',
        selectionMode ? 'cursor-pointer' : 'cursor-pointer',
        'hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)]',
        'hover:border-primary/20 hover:bg-card',
        task.status === 'completed' ? 'opacity-60 grayscale-[0.5]' : '',
        'border-l-[6px]',
        priority.border || 'border-l-transparent',
        isSelected && selectionMode && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground/50" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
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
      </div>

      {/* Selection checkbox */}
      {selectionMode && (
        <div className="flex-shrink-0 mt-0.5">
          <div className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
          )}>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 pt-0.5">
        <h3 className={cn(
          'text-[15px] font-semibold tracking-tight leading-snug transition-all duration-300',
          task.status === 'completed' ? 'line-through text-muted-foreground/70' : 'text-foreground/90'
        )}>
          {task.title}
        </h3>
        {task.description && (
          <p className="text-xs text-muted-foreground/60 line-clamp-1 mt-1 font-medium">
            {task.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2.5">
          {task.priority !== 'none' && priority.icon && (
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider',
              priority.bg,
              priority.color
            )}>
              <priority.icon className="w-3 h-3" />
              {priority.label}
            </span>
          )}          {task.date && (
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
          {task.deadline && (
            <span className={cn(
              'inline-flex items-center gap-1.5 text-[12px]',
              isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground/80'
            )}>
              <Clock className="w-3.5 h-3.5" />
              Due {format(parseISO(task.deadline), 'MMM d')}
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
          {ageIndicator && (
            <Badge variant="outline" className={cn("text-[10px] h-5 px-2", ageIndicator.color)}>
              {ageIndicator.label}
            </Badge>
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

// ─── Quick Stats ─────────────────────────────────────────────────────────────
function QuickStatsWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <QuickStats />
    </motion.div>
  );
}

// ─── Goal Tracker ─────────────────────────────────────────────────────────────
function GoalTrackerWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-8"
    >
      <GoalTracker />
    </motion.div>
  );
}

// ─── Habit Tracker ────────────────────────────────────────────────────────────
function HabitTrackerWidget({ tasks, onTaskComplete }: { tasks: Task[]; onTaskComplete: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="mb-8"
    >
      <HabitTracker tasks={tasks} onTaskComplete={onTaskComplete} />
    </motion.div>
  );
}

// ─── AI Assistant ─────────────────────────────────────────────────────────────
function AIAssistantWidget({ onTaskCreate }: { onTaskCreate: (task: { title: string; description?: string; date?: string; priority?: string }) => void }) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-8"
    >
      {isCollapsed ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="text-muted-foreground"
        >
          Show AI Assistant
        </Button>
      ) : (
        <Card className="border-brand-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-brand-500" />
                AI Assistant
              </span>
              <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(true)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AIAssistant onTaskCreate={onTaskCreate} />
          </CardContent>
        </Card>
      )}
    </motion.div>
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

  const msg = messages[view] || messages.all || { title: 'No tasks', desc: 'No tasks to show.' };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center">
      <EmptyStateIllustration view={view} className="mb-6" />
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
  onSelect,
  onReorder,
  isLoading,
  selectedTasks,
  selectionMode,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (task: Task) => void;
  onReorder: (activeId: string, overId: string) => void;
  isLoading: boolean;
  selectedTasks: Set<string>;
  selectionMode: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
          onReorder(active.id as string, over.id as string);
        }
      }}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-10">
          <AnimatePresence mode="popLayout">
            {pendingTasks.length > 0 && (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <SortableTaskCard key={task.id} task={task} onToggle={onToggle}
                    onDelete={onDelete} onSelect={onSelect} isSelected={selectedTasks.has(task.id)}
                    selectionMode={selectionMode} />
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
                    <SortableTaskCard key={task.id} task={task} onToggle={onToggle}
                      onDelete={onDelete} onSelect={onSelect} isSelected={selectedTasks.has(task.id)}
                      selectionMode={selectionMode} />
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
      </SortableContext>
    </DndContext>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'list' | 'kanban' | 'calendar' | 'gantt'>('list');
  const [filters, setFilters] = React.useState<{
    priorities: ('high' | 'medium' | 'low' | 'none')[];
    statuses: ('pending' | 'in_progress' | 'completed' | 'cancelled')[];
    labels: string[];
    dateFrom: string;
    dateTo: string;
    minEstimate: string;
    maxEstimate: string;
  }>({
    priorities: [],
    statuses: [],
    labels: [],
    dateFrom: '',
    dateTo: '',
    minEstimate: '',
    maxEstimate: '',
  });

  const {
    activeView,
    activeList,
    activeLabel,
    searchQuery,
    selectedTasks,
    isSelectionMode,
    selectTask,
    clearSelection,
  } = useTaskStore();

  const selectionMode = isSelectionMode;

  const handleSelect = (task: Task) => {
    if (selectionMode) {
      selectTask(task.id);
    } else {
      setSelectedTask(task);
      setIsDetailOpen(true);
    }
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleClearFilters = () => {
    setFilters({
      priorities: [],
      statuses: [],
      labels: [],
      dateFrom: '',
      dateTo: '',
      minEstimate: '',
      maxEstimate: '',
    });
  };

  // Queries
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', activeView, activeList, activeLabel, filters],
    queryFn: () => fetchTasks(activeView, activeList, activeLabel, filters),
  });

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; listId?: string | null; date?: string | null; priority?: string }) => {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          listId: data.listId ?? (activeView === 'list' ? activeList : null),
          date: data.date ?? (activeView === 'today' ? new Date().toISOString().split('T')[0] : null),
          priority: data.priority || 'none',
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
    onError: (err: Error, _id, context) => {
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
    onError: (err: Error, _id, context) => {
      queryClient.setQueryData(['tasks', activeView, activeList], context?.previousTasks);
      toast.error(err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleAdd = (title: string) => {
    // Try to parse natural language
    const parsed = parseNaturalLanguage(title);
    createMutation.mutate({
      title: parsed.title,
      date: parsed.date || null,
      priority: parsed.priority || 'none',
    });
  };

  const handleAddFromAI = (task: { title: string; description?: string; date?: string; priority?: string }) => {
    createMutation.mutate({
      title: task.title,
      date: task.date || null,
      priority: (task.priority as 'high' | 'medium' | 'low' | 'none') || 'none',
    });
  };

  const handleAddFromTemplate = (task: Partial<{ title: string; description: string; priority: 'high' | 'medium' | 'low' | 'none'; estimateHours: number; estimateMinutes: number; isAllDay: boolean; recurringType: string }>) => {
    if (!task.title) return;
    createMutation.mutate({
      title: task.title,
      priority: task.priority || 'none',
    });
  };
  const handleToggle = (id: string) => toggleMutation.mutate(id);
  const handleDelete = (id: string) => deleteMutation.mutate(id);

  // Filter by search and other filters
  const filteredTasks = React.useMemo(() => {
    let result = tasks;

    // Search filter
    if (searchQuery) {
      result = result.filter((t) =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter((t) => filters.priorities.includes(t.priority));
    }

    // Status filter
    if (filters.statuses.length > 0) {
      result = result.filter((t) => filters.statuses.includes(t.status));
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      result = result.filter((t) => {
        if (t.date) {
          const taskDate = t.date;
          if (filters.dateFrom && taskDate < filters.dateFrom) return false;
          if (filters.dateTo && taskDate > filters.dateTo) return false;
        }
        return true;
      });
    }

    // Time estimate filter
    if (filters.minEstimate || filters.maxEstimate) {
      result = result.filter((t) => {
        const totalMinutes = (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
        const totalHours = totalMinutes / 60;
        if (filters.minEstimate && totalHours < parseFloat(filters.minEstimate)) return false;
        if (filters.maxEstimate && totalHours > parseFloat(filters.maxEstimate)) return false;
        return true;
      });
    }

    return result;
  }, [tasks, searchQuery, filters]);

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ activeId, newPosition }: { activeId: string; newPosition: number }) => {
      await fetch(`/api/tasks/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: activeId,
          newPosition,
        }),
      });
      return { success: true };
    },
    onError: (err: Error) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', activeView, activeList] });
      toast.error(err.message);
    },
  });

  const handleReorder = (activeId: string, overId: string) => {
    const activeIndex = filteredTasks.findIndex(t => t.id === activeId);
    const overIndex = filteredTasks.findIndex(t => t.id === overId);

    if (activeIndex === -1 || overIndex === -1) return;

    const newTasks = arrayMove([...filteredTasks], activeIndex, overIndex);
    queryClient.setQueryData(['tasks', activeView, activeList], newTasks);

    reorderMutation.mutate({ activeId, newPosition: overIndex });
  };

  const listName = activeList
    ? lists.find((l: List) => l.id === activeList)?.name
    : undefined;

  // Keyboard shortcuts
  const [isHelpOpen, setIsHelpOpen] = React.useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);
  const [isPWAOpen, setIsPWAOpen] = React.useState(false);

  useKeyboardShortcuts({
    onNewTask: () => document.querySelector('input')?.focus(),
    onSearch: () => document.querySelector('input')?.focus(),
    onToggleView: () => setViewMode(v => v === 'list' ? 'kanban' : 'list'),
    onViewChange: (view) => setViewMode(view),
    onShowHelp: () => setIsHelpOpen(true),
    onDismiss: () => {
      setIsDetailOpen(false);
      setIsHelpOpen(false);
    },
  });

  // Check for onboarding
  React.useEffect(() => {
    const completed = localStorage.getItem('taskplanner-onboarding-completed');
    if (!completed) {
      setIsOnboardingOpen(true);
    }
  }, []);

  // Check for PWA install
  React.useEffect(() => {
    const deferredPrompt = (window as any).__taskplannerDeferredPrompt;
    if (deferredPrompt) {
      setIsPWAOpen(true);
    }
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={cn(
          "mx-auto",
          viewMode === 'kanban' ? 'max-w-[1600px]' : 'max-w-3xl'
        )}>
          <PageHeader view={activeView} listName={listName} />
          {viewMode === 'list' && <QuickStatsWidget />}
          {viewMode === 'list' && <GoalTrackerWidget />}
          {viewMode === 'list' && <HabitTrackerWidget tasks={filteredTasks} onTaskComplete={handleToggle} />}
          {viewMode === 'list' && <AIAssistantWidget onTaskCreate={handleAddFromAI} />}

          {/* View Toggle and Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center rounded-xl bg-muted/50 p-1">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-7 px-3 rounded-lg"
                >
                  <ListIcon className="w-3.5 h-3.5 mr-1.5" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  className="h-7 px-3 rounded-lg"
                >
                  <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
                  Board
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="h-7 px-3 rounded-lg"
                >
                  <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'gantt' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('gantt')}
                  className="h-7 px-3 rounded-lg"
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                  Gantt
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TaskTemplates onCreateTask={handleAddFromTemplate} />
              <TaskFilter
                filters={filters}
                onFiltersChange={setFilters}
                onClear={handleClearFilters}
              />
            </div>
          </div>

          <div className="space-y-10">
            {viewMode === 'kanban' ? (
              <KanbanBoard
                onTaskSelect={setSelectedTask}
              />
            ) : viewMode === 'calendar' ? (
              <CalendarView onTaskSelect={setSelectedTask} />
            ) : viewMode === 'gantt' ? (
              <GanttChart tasks={tasks} onTaskSelect={setSelectedTask} />
            ) : (
              <>
                <QuickAdd onAdd={handleAdd} />
                {filteredTasks.length === 0 && !isLoading ? (
                  <EmptyState view={activeView} onAddClick={() => document.querySelector('input')?.focus()} />
                ) : (
                  <>
                    {selectedTasks.size > 0 && (
                      <div className="mb-4 p-4 rounded-xl bg-muted/50 flex items-center justify-between">
                        <span className="font-medium">{selectedTasks.size} tasks selected</span>
                        <div className="flex gap-2">
                          <BulkActions selectedIds={selectedTasks} onClearSelection={handleClearSelection} />
                        </div>
                      </div>
                    )}
                    <TaskList
                      tasks={filteredTasks}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onSelect={handleSelect}
                      onReorder={handleReorder}
                      isLoading={isLoading}
                      selectedTasks={selectedTasks}
                      selectionMode={selectionMode}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <TaskDetailDialog
        task={selectedTask}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
      <OnboardingWelcome
        open={isOnboardingOpen}
        onComplete={() => setIsOnboardingOpen(false)}
      />
      <KeyboardShortcutHelp
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
      />
      <PWAPrompt
        open={isPWAOpen}
        onOpenChange={setIsPWAOpen}
      />
      <FocusMode
        task={selectedTask ?? undefined}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
