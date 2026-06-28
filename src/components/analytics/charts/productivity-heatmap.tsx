'use client';

import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ProductivityHeatmapProps {
  data: { date: string; completed: number; created: number }[];
  className?: string;
}

export function ProductivityHeatmap({ data, className }: ProductivityHeatmapProps) {
  const maxCount = Math.max(...data.map(d => d.completed), 1);

  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/20';
    if (count <= maxCount * 0.25) return 'bg-brand-500/10';
    if (count <= maxCount * 0.5) return 'bg-brand-500/30';
    if (count <= maxCount * 0.75) return 'bg-brand-500/50';
    return 'bg-brand-500';
  };

  return (
    <div className={cn("bg-card/50 rounded-xl p-6 border border-border/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <h3 className="font-bold">Productivity Heatmap</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          Last {data.length} days
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {data.slice(-35).map((day, i) => {
          const count = day.completed;
          return (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium",
                getColor(count),
                count > 0 ? 'text-foreground' : 'text-muted-foreground/40'
              )}
              title={`${format(new Date(day.date), 'MMM d')}: ${count} completed`}
            >
              {count > 0 ? count : ''}
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4 text-xs">
        <span className="text-muted-foreground">Less active</span>
        <div className="flex items-center gap-1">
          {[0, 0.25, 0.5, 0.75, 1].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-4 h-2 rounded-sm",
                i === 0 ? 'bg-muted/20' :
                i === 1 ? 'bg-brand-500/10' :
                i === 2 ? 'bg-brand-500/30' :
                i === 3 ? 'bg-brand-500/50' : 'bg-brand-500'
              )}
            />
          ))}
        </div>
        <span className="text-muted-foreground">More active</span>
      </div>
    </div>
  );
}