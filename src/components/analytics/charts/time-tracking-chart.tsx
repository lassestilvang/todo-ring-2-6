'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeTrackingChartProps {
  data: {
    totalEstimated: { hours: number; minutes: number };
    totalActual: { hours: number; minutes: number };
    avgEstimated: { hours: number; minutes: number };
    avgActual: { hours: number; minutes: number };
    underEstimation: number;
    overEstimation: number;
  };
  className?: string;
}

export function TimeTrackingChart({ data, className }: TimeTrackingChartProps) {
  const totalEstimatedMinutes = data.totalEstimated.hours * 60 + data.totalEstimated.minutes;
  const totalActualMinutes = data.totalActual.hours * 60 + data.totalActual.minutes;

  const efficiency = totalEstimatedMinutes > 0
    ? Math.round((Math.min(totalEstimatedMinutes, totalActualMinutes) / Math.max(totalEstimatedMinutes, totalActualMinutes)) * 100)
    : 0;

  return (
    <div className={cn("bg-card/50 rounded-xl p-6 border border-border/50", className)}>
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Clock className="w-4 h-4" />
        <h3 className="font-bold">Time Tracking Analysis</h3>
      </div>

      <div className="space-y-4">
        {/* Total Time Comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Estimated</p>
            <p className="text-2xl font-black">
              {data.totalEstimated.hours}h {data.totalEstimated.minutes}m
            </p>
          </div>
          <div className="bg-muted/20 rounded-xl p-4 text-center">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Actual</p>
            <p className="text-2xl font-black">
              {data.totalActual.hours}h {data.totalActual.minutes}m
            </p>
          </div>
        </div>

        {/* Efficiency Gauge */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estimation Efficiency</span>
            <span className="text-sm font-bold">{efficiency}%</span>
          </div>
          <div className="w-full bg-muted/30 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${efficiency}%` }}
              transition={{ duration: 0.5 }}
              className={cn(
                "h-2 rounded-full transition-all",
                efficiency >= 80 ? "bg-emerald-500" :
                efficiency >= 60 ? "bg-amber-500" : "bg-red-500"
              )}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground/60">
            <span>Under</span>
            <span>Accurate</span>
            <span>Over</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-lg font-bold text-emerald-500">{data.underEstimation}</p>
            <p className="text-[10px] text-muted-foreground">On Track</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-lg font-bold">{data.avgEstimated.hours}h {data.avgEstimated.minutes}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Estimate</p>
          </div>
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-lg font-bold">{data.avgActual.hours}h {data.avgActual.minutes}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Actual</p>
          </div>
        </div>
      </div>
    </div>
  );
}