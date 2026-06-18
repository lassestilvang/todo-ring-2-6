'use client';

import { motion } from 'framer-motion';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductivityScoreProps {
  score: number;
  previousScore?: number;
  className?: string;
}

export function ProductivityScore({ score, previousScore, className }: ProductivityScoreProps) {
  const trend = previousScore
    ? score > previousScore ? 'up' : score < previousScore ? 'down' : 'neutral'
    : 'neutral';

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-emerald-500/10';
    if (score >= 60) return 'from-amber-500/20 to-amber-500/10';
    return 'from-red-500/20 to-red-500/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/50 rounded-xl p-6 border border-border/50",
        `bg-gradient-to-br ${getScoreBg(score)}`,
        className
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Award className="w-4 h-4" />
        <span className="text-[11px] font-bold uppercase tracking-wider">Productivity Score</span>
      </div>

      <div className="flex items-end gap-3">
        <p className={cn("text-4xl font-black", getScoreColor(score))}>
          {score}
        </p>
        <p className="text-sm text-muted-foreground mb-1">out of 100</p>
      </div>

      {previousScore !== undefined && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          <span className={cn(
            "font-medium",
            trend === 'up' ? 'text-emerald-500' :
            trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {trend === 'up' ? 'Up' : trend === 'down' ? 'Down' : 'Stable'}
          </span>
          <span className="text-muted-foreground/60">vs last period</span>
        </div>
      )}
    </motion.div>
  );
}