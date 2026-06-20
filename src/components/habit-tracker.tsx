'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Check, X as XIcon, TrendingUp, Award } from 'lucide-react';
import { format, subDays, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/index';
import type { HabitStreak } from '@/db/operations';

interface HabitTrackerProps {
  tasks: Task[];
  onTaskComplete?: (taskId: string) => void;
}

// Fetch habit streaks
async function fetchHabitStreaks(): Promise<Record<string, HabitStreak>> {
  // In a real app, this would fetch from an API
  // For now, we'll derive streaks from completed tasks
  return {};
}

// Habit streak card
function HabitCard({
  task,
  streak,
  onToggle,
}: {
  task: Task;
  streak?: HabitStreak;
  onToggle: (taskId: string) => void;
}) {
  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const isComplete = task.status === 'completed';

  // Generate calendar heatmap for last 30 days
  const heatmapDays = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      days.push(subDays(today, i));
    }
    return days;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Card className={cn("relative overflow-hidden transition-all duration-300", isComplete && "opacity-60")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="truncate">{task.title}</span>
            <button
              onClick={() => onToggle(task.id)}
              className={cn(
                "w-8 h-8 rounded-full transition-all duration-200",
                isComplete
                  ? "bg-emerald-500/20 text-emerald-600"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
              )}
            >
              {isComplete ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Streak info */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Current Streak</p>
                <p className="text-2xl font-bold text-orange-500">{currentStreak}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Best</p>
                <p className="text-sm font-bold">{longestStreak}</p>
              </div>
            </div>

            {/* Heatmap */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Last 30 days</p>
              <div className="flex gap-1">
                {heatmapDays.map((day, i) => {
                  const isTodayDay = isToday(day);
                  const isYesterdayDay = isYesterday(day);
                  // In a real implementation, we'd check if the habit was completed on this day
                  const wasCompleted = isTodayDay || (!isTodayDay && Math.random() > 0.3);

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger>
                        <div
                          className={cn(
                            "w-2 h-2 rounded-sm transition-all",
                            wasCompleted
                              ? isTodayDay
                                ? "bg-orange-500"
                                : isYesterdayDay
                                ? "bg-orange-400"
                                : "bg-orange-500/60"
                              : "bg-muted/30"
                          )}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{format(day, 'MMM d')}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">Completion Rate</p>
                <p className="text-sm font-bold">78%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground/60 uppercase">Level</p>
                <p className="text-sm font-bold flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  5
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <div
          className="absolute top-0 right-0 w-1 h-full"
          style={{ backgroundColor: isComplete ? '#f59e0b' : '#3b82f6' }}
        />
      </Card>
    </motion.div>
  );
}

// Import Tooltip components
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function HabitTracker({ tasks, onTaskComplete }: HabitTrackerProps) {
  const habitTasks = tasks.filter(t => t.isHabit);

  if (habitTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Flame className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No habits tracked yet. Mark tasks as habits to track streaks!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Habit Streaks
        </h3>
        <Badge variant="outline">
          <TrendingUp className="w-3 h-3 mr-1" />
          {habitTasks.filter(t => t.status === 'completed').length} Active
        </Badge>
      </div>

      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {habitTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <HabitCard
                  task={task}
                  streak={{
                    id: `streak-${task.id}`,
                    taskId: task.id,
                    currentStreak: task.status === 'completed' ? 1 : 0,
                    longestStreak: 5,
                    lastCompleted: task.completedAt,
                    streakStart: task.completedAt,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                  }}
                  onToggle={() => onTaskComplete?.(task.id)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    </div>
  );
}