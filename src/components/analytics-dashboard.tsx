'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Calendar, Award, Target, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

async function fetchAnalytics() {
  const res = await fetch('/api/analytics/dashboard');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch analytics');
  return json.data;
}

async function fetchProductivityMetrics() {
  const res = await fetch('/api/analytics/productivity?range=30d');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch productivity');
  return json.data;
}

async function exportAnalytics(format: 'json' | 'csv' | 'markdown') {
  const res = await fetch(`/api/export/analytics?format=${format}`);
  if (!res.ok) throw new Error('Export failed');

  if (format !== 'json') {
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics.${format === 'markdown' ? 'md' : format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  return res.json();
}

interface AnalyticsData {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  overdueCount: number;
  completionRate: number;
  dailyCompletion: { date: string; count: number }[];
  totalTimeTracked: { hours: number; minutes: number };
}

interface ProductivityMetrics {
  streak: number;
  bestStreak: number;
  averageTaskTime: { hours: number; minutes: number };
  mostProductiveDay: string;
  completionByPriority: { high: number; medium: number; low: number };
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [isExporting, setIsExporting] = useState(false);
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: fetchAnalytics,
    refetchInterval: 60000,
  });

  const { data: productivity, isLoading: isLoadingProductivity } = useQuery({
    queryKey: ['productivity', timeRange],
    queryFn: fetchProductivityMetrics,
    refetchInterval: 60000,
  });

  const isLoading = isLoadingAnalytics || isLoadingProductivity;

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    setIsExporting(true);
    try {
      await exportAnalytics(format);
      toast.success(`Analytics exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export analytics');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted/40 rounded animate-pulse w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
        <div className="h-64 bg-muted/40 rounded-xl animate-pulse" />
      </div>
    );
  }

  const analyticsData: AnalyticsData = {
    total: analytics?.total || 0,
    completed: analytics?.completed || 0,
    pending: analytics?.pending || 0,
    inProgress: analytics?.inProgress || 0,
    overdueCount: analytics?.overdueCount || 0,
    completionRate: analytics?.total > 0 ? Math.round((analytics.completed / analytics.total) * 100) : 0,
    dailyCompletion: analytics?.dailyCompletion || [],
    totalTimeTracked: analytics?.totalTime || { hours: 0, minutes: 0 },
  };

  const productivityData: ProductivityMetrics = productivity || {
    streak: 0,
    bestStreak: 0,
    averageTaskTime: { hours: 0, minutes: 0 },
    mostProductiveDay: 'N/A',
    completionByPriority: { high: 0, medium: 0, low: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Productivity Analytics</h2>
          <p className="text-sm text-muted-foreground/60">Insights into your task completion and time management</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg bg-muted/50 p-1">
            {(['week', 'month', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all capitalize ${
                  timeRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="px-3 py-1 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/50 rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Completion Rate</span>
          </div>
          <p className="text-3xl font-black">{analyticsData.completionRate}%</p>
          <div className="w-full bg-muted/30 rounded-full h-1.5 mt-2">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all"
              style={{ width: `${analyticsData.completionRate}%` }}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/50 rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
          </div>
          <p className="text-3xl font-black">{analyticsData.completed}</p>
          <p className="text-[11px] text-muted-foreground/60">out of {analyticsData.total} tasks</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/50 rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Time Tracked</span>
          </div>
          <p className="text-3xl font-black">
            {analyticsData.totalTimeTracked.hours}h {analyticsData.totalTimeTracked.minutes}m
          </p>
          <p className="text-[11px] text-muted-foreground/60">total time estimated</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/50 rounded-xl p-4 border border-border/50"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Current Streak</span>
          </div>
          <p className="text-3xl font-black">{productivityData.streak}</p>
          <p className="text-[11px] text-muted-foreground/60">days in a row</p>
        </motion.div>
      </div>

      {/* Progress & Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Completion Chart */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Daily Completion (Last 7 Days)
          </h3>
          <div className="flex items-end gap-2 h-40">
            {analyticsData.dailyCompletion.map((day, i) => {
              const maxCount = Math.max(...analyticsData.dailyCompletion.map(d => d.count), 1);
              const height = (day.count / maxCount) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: i * 0.1, type: 'spring' }}
                    className="w-full bg-brand-500/50 rounded-t-lg min-h-[10px]"
                  />
                  <span className="text-[10px] text-muted-foreground/60">
                    {format(new Date(day.date), 'EEE')}
                  </span>
                  <span className="text-[10px] font-bold">{day.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak & Achievements */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Streak</span>
              <span className="font-bold text-2xl text-brand-500">{productivityData.streak}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Best Streak</span>
              <span className="font-bold">{productivityData.bestStreak}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completion Rate</span>
              <span className="font-bold">{analyticsData.completionRate}%</span>
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-card/50 rounded-xl p-4 border border-border/50">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Target className="w-4 h-4" />
            Completion by Priority
          </h3>
          <div className="space-y-3">
            {(['high', 'medium', 'low'] as const).map(priority => {
              const count = productivityData.completionByPriority[priority];
              const total = analyticsData.completed;
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={priority} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize flex items-center gap-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        priority === 'high' ? 'bg-red-500' :
                        priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      )} />
                      {priority}
                    </span>
                    <span className="font-bold">{count}</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-1.5">
                    <div
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        priority === 'high' ? 'bg-red-500' :
                        priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

