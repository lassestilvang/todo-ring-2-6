'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductivityData {
  dailyCompletionRate: number;
  weeklyTrend: { date: string; completed: number; created: number }[];
  peakHours: { hour: number; tasksCompleted: number }[];
  efficiencyScore: number;
  streak: number;
}

async function fetchProductivityData(): Promise<ProductivityData> {
  const res = await fetch('/api/analytics/productivity?range=30d');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch productivity data');
  return json.data;
}

export function ProductivityInsightsWidget() {
  const { data: productivity, isLoading } = useQuery({
    queryKey: ['productivity-insights'],
    queryFn: fetchProductivityData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return <div className="space-y-3">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-8 bg-muted rounded animate-pulse" />
      <div className="h-16 bg-muted rounded animate-pulse" />
    </div>;
  }

  const completionRate = productivity?.dailyCompletionRate ?? 0;
  const efficiencyScore = productivity?.efficiencyScore ?? 0;
  const streak = productivity?.streak ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Completion Rate */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            Completion Rate
          </p>
          <p className="text-2xl font-bold">{completionRate}%</p>
          <div className="flex items-center gap-1 text-xs">
            {completionRate >= 70 ? (
              <>
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500">Good</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-amber-500" />
                <span className="text-amber-500">Needs improvement</span>
              </>
            )}
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            Efficiency Score
          </p>
          <p className="text-2xl font-bold">{efficiencyScore}</p>
          <p className="text-xs text-muted-foreground/60">out of 100</p>
        </div>

        {/* Streak */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            Current Streak
          </p>
          <p className="text-2xl font-bold text-orange-500">{streak}</p>
          <p className="text-xs text-muted-foreground/60">days</p>
        </div>
      </div>

      {/* Mini Chart */}
      {productivity?.weeklyTrend && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            Weekly Trend
          </p>
          <div className="flex items-end gap-1 h-16">
            {productivity.weeklyTrend.map((day, i) => {
              const maxCount = Math.max(day.completed, day.created, 1);
              const completedHeight = (day.completed / maxCount) * 100;
              const createdHeight = (day.created / maxCount) * 100;

              return (
                <div key={i} className="flex-1 flex flex-col-reverse gap-1">
                  <div className="flex gap-0.5">
                    <div
                      className="flex-1 bg-emerald-500 rounded-sm"
                      style={{ height: `${completedHeight * 0.8}%` }}
                      title={`Completed: ${day.completed}`}
                    />
                    <div
                      className="flex-1 bg-blue-500 rounded-sm opacity-50"
                      style={{ height: `${createdHeight * 0.8}%` }}
                      title={`Created: ${day.created}`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground/60">
                    {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}