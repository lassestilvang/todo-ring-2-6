'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStatsProps {
  className?: string;
}

async function fetchStats() {
  const res = await fetch('/api/stats');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch stats');
  return json.data;
}

export function QuickStats({ className }: QuickStatsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: 60_000,
  });

  if (isLoading || !stats) {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-8 w-8 rounded-lg bg-muted/50 animate-pulse" />
            <div className="h-6 bg-muted/30 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            <div className="h-3 bg-muted/20 rounded animate-pulse w-2/3" style={{ animationDelay: `${i * 100}ms` }} />
          </div>
        ))}
      </div>
    );
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statItems = [
    {
      title: 'Completed',
      value: stats.completed,
      total: stats.total,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      suffix: 'task',
    },
    {
      title: 'Completion Rate',
      value: completionRate,
      suffix: '%',
      icon: TrendingUp,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      suffix: 'task',
    },
    {
      title: 'Today',
      value: new Date().toLocaleDateString('en-US', { weekday: 'short' }),
      subtitle: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      icon: Calendar,
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
      noSuffix: true,
    },
  ];

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4", className)}>
      {statItems.map((item, index) => (
        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "p-4 rounded-2xl border border-border/50 flex items-start gap-3",
            item.bg
          )}
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg)}>
            <item.icon className={cn("w-5 h-5", item.color)} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold tabular-nums">{item.value}</p>
            <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider">
              {item.title}
              {item.total && ` / ${item.total}`}
              {item.subtitle && (
                <span className="block text-muted-foreground/50 font-normal">{item.subtitle}</span>
              )}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}