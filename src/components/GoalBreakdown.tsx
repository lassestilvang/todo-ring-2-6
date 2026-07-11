import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Goal } from '@/types/tasks';
import { fetchGoalBreakdown } from '@/lib/api/goalBreakdown';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLiveRegion } from '@/hooks/useAccessibility';
import { SkipLink } from '@/components/SkipLink';

/**
 * Component for displaying AI-generated goal breakdown.
 * Accepts a goal string and optional context.
 * Displays milestones, tasks, and progress information.
 */
export function GoalBreakdown({ goal, context }: { goal: string; context?: any }) {
  const { data: breakdown, isLoading, error } = useQuery({
    queryKey: ['goal-breakdown', goal, JSON.stringify(context)],
    queryFn: () => fetchGoalBreakdown(goal, context),
  });

  const containerRef = useFocusTrap();
  const { announce } = useLiveRegion();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-12">
        <div className="relative">
          <div className="relative round-brick-3p6">
            <svg
              className="absolute inset-0 w-6 h-6 opacity-70"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v1a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v6a1 1 0 0 0-1 1v1a1 1 0 0 0-2 0v7a1 1 0 0 0-1-1v-1a1 1 0 0 0-2 0v-6a1 1 0 0 0-2 0v-1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1v-6a1 1 0 0 0-1-1v-6a1 1 0 1 0-1 1v6a1 1 0 0 0 1 1v1a1 1 0 0 0 2 0v6a1 1 0 0 0-1 1v-6z"
                fill="currentColor"
                fillOpacity="0.8"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm text-center" role="alert">
        {error.message}
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground/60">No breakdown available.</p>
      </div>
    );
  }

  const announceTask = (taskTitle: string, taskDescription: string) => {
    announce(`Task: ${taskTitle} - ${taskDescription}`);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/50 p-6 lag-600 dark:bg-gray-800",
        "prose lg:prose-lg lg:pt-8 lg:pb-16 lg:br-2 lg:rounded-md mb-6"
      )}
    >
      <SkipLink />
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-5 h-5">
          <div className="relative round-brick-3p6">
            <svg
              className="absolute inset-0 w-5 h-5 opacity-70"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0v1a1 1 0 0 0-1 1v6a1 1 0 0 0 2 0v6a1 1 0 0 0-1 1v1a1 1 0 0 0-2 0v7a1 1 0 0 0-1-1v-1a1 1 0 0 0-2 0v-6a1 1 0 0 0-2 0v-1a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1v-6a1 1 0 0 0-1-1v-6a1 1 0 1 0-1 1v6a1 1 0 0 0 1 1v1a1 1 0 0 0 2 0v6a1 1 0 0 0-1 1v-6z"
                fill="currentColor"
                fillOpacity="0.8"
              />
            </svg>
          </div>
        </div>
        <h2 className="font-bold text-lg">Goal Breakdown</h2>
      </div>

      <div className="flex justify-start gap-2 items-start mb-4">
        <div className="w-8 h-4 bg-primary bg-opacity-50 rounded-full animate-pulse" />
        <span className="sr-only">Progress indicator</span>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Milestones Section */}
        <div className="space-y-8">
          <h3 className="font-medium text-lg mb-2">Milestones</h3>
          <div className="space-y-4">
            {breakdown.milestones.map((milestone, index) => (
              <div
                key={index}
                className="prose prose-sm lg:prose-lg lg:track-tight"
              >
                <h4 className="font-medium text-lg mb-2">{milestone.title}</h4>
                {milestone.tasks.map((task, taskIndex) => (
                  <div
                    key={taskIndex}
                    className="flex items-center gap-3 p-2 border rounded-md transition-colors duration-300 hover:scale-105 [dark:background-bg-primary/10]"
                    role="listitem"
                    aria-label={`${task.title} task`}
                    onMouseEnter={() => {
                      announceTask(task.title, task.description);
                    }}
                  >
                    <span
                      className={cn('w-6 h-4 rounded-md', task.priority.toLowerCase())}
                      aria-hidden="true"
                    >
                      {task.priority === 'high' && '🔥'}
                      {task.priority === 'medium' && '⚡'}
                      {task.priority === 'low' && '🌙'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-primary truncate line-clamp-2">
                          {task.title}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Tasks */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg mb-2">Secondary Tasks</h3>
          <div className="grid grid-cols-2 gap-3">
            {breakdown.secondaryTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md bg-muted/20 p-3 border border-muted-200 hover:bg-muted/30 transition-colors"
                aria-label={task.description}>
                  <span className="text-sm font-medium">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-6">
        <span className="text-sm font-medium text-primary">
          Estimated total effort: {breakdown.estimatedTotalHours} hours
        </span>
        {context?.theme?.colors && (
          <span className="ml-2 text-xs text-muted-foreground/60">
            (based on {breakdown.suggestedTeamSize} members)
          </span>
        )}
      </div>
    </div>
  );
}