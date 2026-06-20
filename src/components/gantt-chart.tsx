'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Link, AlertCircle, BarChart3, RefreshCw, Download, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Task } from '@/types/index';

interface GanttChartProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
}

interface Dependency {
  id: string;
  taskId: string;
  dependsOnId: string;
}

export function GanttChart({ tasks, onTaskSelect }: GanttChartProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [dependencies, setDependencies] = React.useState<Dependency[]>([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate critical path using topological sort
  const calculateCriticalPath = (): Set<string> => {
    const criticalPath = new Set<string>();
    const taskMap = new Map<string, Task>();
    const incoming = new Map<string, number>();

    // Build graph
    tasks.forEach(t => {
      taskMap.set(t.id, t);
      incoming.set(t.id, 0);
    });

    // Count incoming edges
    dependencies.forEach(d => {
      const count = incoming.get(d.taskId) || 0;
      incoming.set(d.taskId, count + 1);
    });

    // Find tasks with no incoming edges (can start immediately)
    const queue: string[] = [];
    incoming.forEach((count, id) => {
      if (count === 0 && taskMap.get(id)?.status !== 'cancelled') {
        queue.push(id);
      }
    });

    // Topological sort
    while (queue.length > 0) {
      const id = queue.shift()!;
      const task = taskMap.get(id);
      if (task && task.status !== 'cancelled') {
        criticalPath.add(id);
      }

      // Reduce incoming count for dependent tasks
      dependencies.forEach(d => {
        if (d.dependsOnId === id) {
          const count = incoming.get(d.taskId) || 0;
          if (count <= 1) {
            queue.push(d.taskId);
          } else {
            incoming.set(d.taskId, count - 1);
          }
        }
      });
    }

    return criticalPath;
  };

  const getStatusColor = (status: string, priority: string, isCritical: boolean) => {
    if (isCritical) return 'border-red-500 bg-red-500/20';
    if (status === 'completed') return 'border-emerald-500 bg-emerald-500/20';
    if (status === 'cancelled') return 'border-gray-500 bg-gray-500/20';
    if (priority === 'high') return 'border-red-500 bg-red-500/10';
    if (priority === 'medium') return 'border-amber-500 bg-amber-500/10';
    return 'border-blue-500 bg-blue-500/10';
  };

  const criticalPath = calculateCriticalPath();

  // Resource allocation tracking
  const resourceAllocation = React.useMemo(() => {
    const allocation: Record<string, number> = {};
    tasks.forEach(t => {
      if (t.estimateHours && t.status !== 'completed') {
        allocation[t.id] = (allocation[t.id] || 0) + t.estimateHours;
      }
    });
    return allocation;
  }, [tasks]);

  const totalHours = Object.values(resourceAllocation).reduce((sum, h) => sum + h, 0);

  const exportToPDF = () => {
    window.print();
  };

  const exportToCSV = () => {
    const csv = [
      ['Task', 'Start Date', 'End Date', 'Priority', 'Status', 'Hours'],
      ...tasks.map(t => [
        t.title,
        t.date || 'N/A',
        t.deadline || 'N/A',
        t.priority,
        t.status,
        `${t.estimateHours || 0}h ${t.estimateMinutes || 0}m`,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gantt-export.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-500" />
            Project Timeline & Dependencies
          </h2>
          <p className="text-sm text-muted-foreground/60">
            {format(monthStart, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="hidden md:flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
              <span>Critical Path ({criticalPath.size})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500" />
              <span>Completed ({tasks.filter(t => t.status === 'completed').length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500" />
              <span>In Progress ({tasks.filter(t => t.status === 'in_progress').length})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Resource Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">
            Total Hours Allocated
          </p>
          <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">
            Critical Tasks
          </p>
          <p className="text-2xl font-bold text-red-500">{criticalPath.size}</p>
        </div>
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">
            Completion Rate
          </p>
          <p className="text-2xl font-bold text-emerald-500">
            {Math.round((tasks.filter(t => t.status === 'completed').length / Math.max(tasks.length, 1)) * 100)}%
          </p>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium">
            {format(monthStart, 'MMMM yyyy')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(addDays(monthStart, -30))}
              className="px-3 py-1 text-sm hover:bg-muted rounded"
            >
              Prev
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addDays(monthStart, 30))}
              className="px-3 py-1 text-sm hover:bg-muted rounded"
            >
              Next
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[200px_1fr] gap-4">
          {/* Task List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider pb-2 border-b">
              Tasks ({tasks.length})
            </div>
            {tasks
              .filter(t => t.date || t.deadline)
              .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
              .map((task) => {
                const isCritical = criticalPath.has(task.id);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onTaskSelect?.(task)}
                    className={cn(
                      "text-sm py-2 px-3 rounded hover:bg-muted/50 cursor-pointer truncate flex items-center gap-2",
                      isCritical && "ring-1 ring-red-500"
                    )}
                    title={task.title}
                  >
                    {isCritical && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />}
                    <span className={cn("flex-1", isCritical ? "font-semibold" : "")}>
                      {task.title}
                    </span>
                    {task.estimateHours > 0 && (
                      <span className="text-xs text-muted-foreground/60">
                        {task.estimateHours}h
                      </span>
                    )}
                  </motion.div>
                );
              })}
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Day Labels */}
            <div className="grid gap-1 pb-2 border-b mb-4" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
              {days.map((day) => (
                <div key={day.toString()} className="text-center text-[10px]">
                  <div className="font-bold">{format(day, 'd')}</div>
                  <div>{format(day, 'EEE')}</div>
                </div>
              ))}
            </div>

            {/* Task Bars */}
            <div className="space-y-2">
              {tasks
                .filter(t => t.date || t.deadline)
                .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
                .map((task) => {
                  const isCritical = criticalPath.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className="grid gap-1"
                      style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}
                    >
                      {days.map((day) => {
                        const isTaskDay = task.date && format(day, 'yyyy-MM-dd') === task.date;
                        return (
                          <div
                            key={day.toString()}
                            className={cn(
                              "h-6 rounded transition-all relative group",
                              isTaskDay
                                ? cn(getStatusColor(task.status, task.priority, isCritical), "group-hover:opacity-80")
                                : 'bg-muted/20'
                            )}
                            onClick={() => onTaskSelect?.(task)}
                          />
                        );
                      })}
                  </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Dependencies Section */}
      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Link className="w-4 h-4" />
          Task Dependencies & Recurrence
        </h3>
        <div className="space-y-3">
          {tasks
            .filter(t => t.recurringType !== 'none')
            .map((task) => (
              <div key={task.id} className="flex items-center gap-3 text-sm p-2 bg-muted/20 rounded-lg">
                <RefreshCw className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground/60">
                    Recurring: {task.recurringType}
                    {task.recurringInterval && ` every ${task.recurringInterval} days`}
                  </p>
                </div>
              </div>
            ))}
          {tasks.filter(t => t.recurringType !== 'none').length === 0 && (
            <p className="text-sm text-muted-foreground/60">No recurring tasks</p>
          )}
        </div>
      </div>
    </div>
  );
}