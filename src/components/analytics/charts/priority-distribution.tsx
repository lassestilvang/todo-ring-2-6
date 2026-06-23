'use client';

import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriorityDistributionProps {
  data: { high: number; medium: number; low: number; none: number; completed: { high: number; medium: number; low: number; none: number } };
  className?: string;
}

export function PriorityDistribution({ data, className }: PriorityDistributionProps) {
  const total = data.high + data.medium + data.low + data.none;
  const completedTotal = data.completed.high + data.completed.medium + data.completed.low + data.completed.none;

  const priorities = [
    { key: 'high', label: 'High', color: 'bg-red-500', textColor: 'text-red-500', value: data.high, completed: data.completed.high },
    { key: 'medium', label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-500', value: data.medium, completed: data.completed.medium },
    { key: 'low', label: 'Low', color: 'bg-blue-500', textColor: 'text-blue-500', value: data.low, completed: data.completed.low },
    { key: 'none', label: 'None', color: 'bg-gray-500', textColor: 'text-gray-500', value: data.none, completed: data.completed.none },
  ];

  return (
    <div className={cn("bg-card/50 rounded-xl p-6 border border-border/50", className)}>
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Target className="w-4 h-4" />
        <h3 className="font-bold">Priority Distribution</h3>
      </div>

      <div className="space-y-4">
        {priorities.map((priority, i) => {
          const percentage = total > 0 ? (priority.value / total) * 100 : 0;
          const completedPercentage = priority.value > 0 ? (priority.completed / priority.value) * 100 : 0;

          return (
            <motion.div
              key={priority.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", priority.color)} />
                  {priority.label}
                </span>
                <span className="text-muted-foreground">{priority.value} tasks</span>
              </div>

              <div className="w-full bg-muted/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={cn("h-2 rounded-full", priority.color)}
                />
              </div>

              {priority.value > 0 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{Math.round(completedPercentage)}% completed</span>
                  <span>{priority.completed} of {priority.value}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}