'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompletionChartProps {
  data: { date: string; completed: number; created: number }[];
  className?: string;
}

export function CompletionChart({ data, className }: CompletionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("bg-card/50 rounded-xl p-6 border border-border/50", className)}>
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <BarChart3 className="w-4 h-4" />
          <h3 className="font-bold">Daily Completion Trend</h3>
        </div>
        <div className="text-center py-12 text-muted-foreground">
          No data available for this period
        </div>
      </div>
    );
  }

  const maxCompleted = Math.max(...data.map(d => d.completed), 1);
  const maxCreated = Math.max(...data.map(d => d.created), 1);

  return (
    <div className={cn("bg-card/50 rounded-xl p-6 border border-border/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          <h3 className="font-bold">Daily Completion Trend</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3 inline mr-1" />
          {data.reduce((sum, d) => sum + d.completed, 0)} completed
        </div>
      </div>

      <div className="flex items-end gap-2 h-40">
        {data.map((day, i) => {
          const completedHeight = (day.completed / maxCompleted) * 100;
          const createdHeight = (day.created / maxCreated) * 100;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="flex items-end justify-center gap-1 h-32">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${completedHeight}%` }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                  className="w-5 bg-brand-500/80 rounded-t-sm min-h-[4px]"
                  title={`Completed: ${day.completed}`}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${createdHeight * 0.7}%` }}
                  transition={{ delay: i * 0.05 + 0.1, type: 'spring', stiffness: 300 }}
                  className="w-5 bg-muted/40 rounded-t-sm min-h-[2px]"
                  title={`Created: ${day.created}`}
                />
              </div>
              <div className="text-[10px] text-muted-foreground/60">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-[10px] font-bold text-muted-foreground/80">
                {day.completed}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-brand-500/80 rounded-sm" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-muted/40 rounded-sm" />
          <span className="text-muted-foreground">Created</span>
        </div>
      </div>
    </div>
  );
}