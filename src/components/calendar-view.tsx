'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday as dateFnsIsToday,
} from 'date-fns';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/index';

async function fetchTasksForRange(startDate: string, endDate: string) {
  const res = await fetch(`/api/tasks?dateFrom=${startDate}&dateTo=${endDate}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch tasks');
  return json.data as Task[];
}

type ViewMode = 'month' | 'week' | 'day';

// Recurrence visualization component
function RecurrenceIndicator({ task }: { task: Task }) {
  if (task.recurringType === 'none') return null;

  const recurrenceLabels: Record<string, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    weekdays: 'Weekdays',
    monthly: 'Monthly',
    yearly: 'Yearly',
    custom: 'Custom',
  };

  return (
    <div className="flex items-center gap-1 text-[10px] text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
      <RefreshCw className="w-3 h-3" />
      <span>{recurrenceLabels[task.recurringType] || 'Recurring'}</span>
    </div>
  );
}

// iCal export function
function exportToICal(tasks: Task[]): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskPlanner//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    ...tasks.flatMap((task: Task) => {
      if (!task.date) return [];
      const startDate = new Date(task.date);

      const lines = [
        'BEGIN:VEVENT',
        `UID:${task.id}`,
        `DTSTART;VALUE=DATE:${format(startDate, 'yyyyMMdd')}`,
        `SUMMARY:${task.title.replace(/\n/g, '\\n')}`,
        task.description && `DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`,
        task.deadline && `DUE:${format(new Date(task.deadline), 'yyyyMMdd')}`,
        `PRIORITY:${task.priority === 'high' ? 1 : task.priority === 'medium' ? 5 : task.priority === 'low' ? 9 : 0}`,
        'END:VEVENT',
      ];
      return lines.filter(Boolean);
    }),
    'END:VCALENDAR',
  ].join('\n');
}

export function CalendarView({ onTaskSelect }: { onTaskSelect: (task: Task) => void }) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<ViewMode>('month');
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);

  const startDate = viewMode === 'month'
    ? format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    : viewMode === 'week'
    ? format(startOfWeek(currentMonth), 'yyyy-MM-dd')
    : format(currentMonth, 'yyyy-MM-dd');

  const endDate = viewMode === 'month'
    ? format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    : viewMode === 'week'
    ? format(endOfWeek(currentMonth), 'yyyy-MM-dd')
    : format(currentMonth, 'yyyy-MM-dd');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'calendar', startDate, endDate],
    queryFn: () => fetchTasksForRange(startDate, endDate),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, date }: { id: string; date: string | null }) => {
      const res = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, date }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update task');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overDate = over.id as string;

    const task = tasks.find((t: Task) => t.id === taskId);
    if (!task) return;

    updateMutation.mutate({ id: taskId, date: overDate });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(direction === 'prev'
      ? addDays(currentMonth, viewMode === 'month' ? -30 : -7)
      : addDays(currentMonth, viewMode === 'month' ? 30 : 7)
    );
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter((t: Task) => t.date === dateStr);
  };

  const getDatesForView = () => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: startDate, end: endDate });
    } else if (viewMode === 'week') {
      return eachDayOfInterval({
        start: startOfWeek(currentMonth),
        end: endOfWeek(currentMonth),
      });
    } else {
      return [currentMonth];
    }
  };

  const handleExport = () => {
    const icsContent = exportToICal(tasks);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-${format(new Date(), 'yyyy-MM-dd')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    // Simple parsing - in production would use a proper ICS parser
    const lines = text.split('\n');
    const events: Partial<Task>[] = [];
    let currentEvent: Record<string, string> = {};

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {};
      } else if (line.startsWith('END:VEVENT')) {
        if (currentEvent.UID && currentEvent.SUMMARY) {
          events.push({
            title: currentEvent.SUMMARY,
            description: currentEvent.DESCRIPTION,
          });
        }
      } else if (line.includes('=')) {
        const parts = line.split('=');
        const key = parts[0];
        const value = parts.slice(1).join('=');
        if (key) {
          currentEvent[key] = value;
        }
      }
    }

    setIsImportDialogOpen(false);
    // Would need API endpoint to import
  };

  const dates = getDatesForView();

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-card/50 rounded-xl">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {viewMode === 'month'
              ? format(currentMonth, 'MMMM yyyy')
              : viewMode === 'week'
              ? `${format(startOfWeek(currentMonth), 'MMM d')} - ${format(endOfWeek(currentMonth), 'MMM d')}`
              : format(currentMonth, 'MMMM d, yyyy')
            }
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date())}>
              Today
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExportDialogOpen(true)}
            title="Export to iCal"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsImportDialogOpen(true)}
            title="Import from iCal"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Import
          </Button>
          <div className="inline-flex items-center rounded-lg bg-muted/50 p-1">
            {[
              { id: 'month', label: 'Month' },
              { id: 'week', label: 'Week' },
              { id: 'day', label: 'Day' },
            ].map(view => (
              <Button
                key={view.id}
                variant={viewMode === view.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode(view.id as ViewMode)}
                className="h-7 px-3"
              >
                {view.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={dates.map(d => format(d, 'yyyy-MM-dd'))} strategy={verticalListSortingStrategy}>
          {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-xs font-bold text-muted-foreground/60 text-center py-2">
                  {day}
                </div>
              ))}
              {dates.map(day => {
                const dayTasks = getTasksForDate(day);
                const isCurrentMonth = format(day, 'MM') === format(currentMonth, 'MM');
                const isCurrentDay = dateFnsIsToday(day);

                return (
                  <SortableDayCell
                    key={day.toString()}
                    day={day}
                    dateStr={format(day, 'yyyy-MM-dd')}
                    tasks={dayTasks}
                    isCurrentMonth={isCurrentMonth}
                    isCurrentDay={isCurrentDay}
                    onTaskSelect={onTaskSelect}
                  />
                );
              })}
            </div>
          )}

          {viewMode === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {dates.map(day => {
                const dayTasks = getTasksForDate(day);
                const isCurrentDay = dateFnsIsToday(day);

                return (
                  <div key={day.toString()} className="space-y-2">
                    <div className={cn(
                      'text-sm font-semibold text-center py-2 rounded-lg',
                      isCurrentDay ? 'bg-primary text-primary-foreground' : 'bg-muted/30'
                    )}>
                      {format(day, 'EEE d')}
                    </div>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {dayTasks.slice(0, 5).map(task => (
                        <TaskCard key={task.id} task={task} onClick={onTaskSelect} />
                      ))}
                      {dayTasks.length > 5 && (
                        <div className="text-[10px] text-muted-foreground/60 text-center">
                          +{dayTasks.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM d, yyyy')}</h2>
              {getTasksForDate(currentMonth).length === 0 ? (
                <p className="text-muted-foreground/60 italic">No tasks for this day</p>
              ) : (
                getTasksForDate(currentMonth).map(task => (
                  <TaskCard key={task.id} task={task} onClick={onTaskSelect} />
                ))
              )}
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Tasks</DialogTitle>
            <DialogDescription>
              Export your tasks to iCal format for use in other calendar applications.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleExport} className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download .ics file
          </Button>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Tasks</DialogTitle>
            <DialogDescription>
              Import tasks from an iCal (.ics) file.
            </DialogDescription>
          </DialogHeader>
          <Input type="file" accept=".ics,.ical" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImport(file);
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple task card for week/day views
function TaskCard({ task, onClick }: { task: Task; onClick: (task: Task) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick(task)}
      className={cn(
        'text-xs p-2 rounded mb-1 cursor-pointer border-l-2 bg-card hover:opacity-80 transition-opacity',
        task.priority === 'high' ? 'border-red-500 bg-red-500/5' :
        task.priority === 'medium' ? 'border-amber-500 bg-amber-500/5' :
        task.priority === 'low' ? 'border-blue-500 bg-blue-500/5' :
        'border-muted bg-muted/20'
      )}
      title={task.title}
    >
      <div className="font-medium truncate">{task.title.slice(0, 30)}</div>
      <RecurrenceIndicator task={task} />
    </motion.div>
  );
}

// Day cell component for month view
function SortableDayCell({
  day,
  dateStr,
  tasks,
  isCurrentMonth,
  isCurrentDay,
  onTaskSelect,
}: {
  day: Date;
  dateStr: string;
  tasks: Task[];
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
  onTaskSelect: (task: Task) => void;
}) {
  return (
    <SortableContext items={[dateStr]} strategy={verticalListSortingStrategy}>
      <motion.div
        className={cn(
          'min-h-[120px] p-2 rounded-xl border transition-colors',
          isCurrentDay
            ? 'border-primary bg-primary/5'
            : isCurrentMonth
            ? 'border-border bg-card/30 hover:bg-card/50'
            : 'border-transparent bg-muted/10 opacity-50'
        )}
        whileHover={{ scale: isCurrentMonth ? 1.02 : 1 }}
      >
        <div className={cn(
          'text-sm font-semibold mb-2',
          isCurrentDay ? 'text-primary' : isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'
        )}>
          {format(day, 'd')}
        </div>
        <div className="space-y-1">
          {tasks.slice(0, 3).map(task => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => onTaskSelect(task)}
              className={cn(
                'text-[10px] p-1.5 rounded truncate cursor-pointer border-l-2',
                task.priority === 'high' ? 'border-red-500 bg-red-500/10' :
                task.priority === 'medium' ? 'border-amber-500 bg-amber-500/10' :
                task.priority === 'low' ? 'border-blue-500 bg-blue-500/10' :
                'border-muted bg-muted/20'
              )}
              title={task.title}
            >
              {task.title.slice(0, 25)}
            </motion.div>
          ))}
          {tasks.length > 3 && (
            <div className="text-[10px] text-muted-foreground/60">
              +{tasks.length - 3} more
            </div>
          )}
        </div>
      </motion.div>
    </SortableContext>
  );
}