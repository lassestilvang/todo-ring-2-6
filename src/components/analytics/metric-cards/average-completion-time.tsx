'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvgCompletionTimeProps {
  hours: number;
  minutes: number;
  className?: string;
}

export function AvgCompletionTime({ hours, minutes, className }: AvgCompletionTimeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cn(
        "bg-card/50 rounded-xl p-4 border border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Clock className="w-4 h-4" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Avg Completion Time</span>
      </div>

      <p className="text-2xl font-black">
        {hours}h {minutes}m
      </p>

      <p className="text-[11px] text-muted-foreground/60 mt-1">
        Average time to complete a task
      </p>
    </motion.div>
  );
}