'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, CheckCircle2, Calendar, Award, Target, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CompletionChart } from '@/components/analytics/charts/completion-chart';
import { PriorityDistribution } from '@/components/analytics/charts/priority-distribution';
import { TimeTrackingChart } from '@/components/analytics/charts/time-tracking-chart';
import { ProductivityHeatmap } from '@/components/analytics/charts/productivity-heatmap';
import { ProductivityScore } from '@/components/analytics/metric-cards/productivity-score';
import { AvgCompletionTime } from '@/components/analytics/metric-cards/average-completion-time';
import { Button } from '@/components/ui/button';
import { TrendingDown } from 'lucide-react';

interface AnalyticsData {
  range: string;
  startDate: string;
  endDate: string;
  summary: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    completionRate: number;
    overdueCount: number;
    overdueRate: number;
  };
  dailyCompletion: { date: string; completed: number; created: number }[];
  priorityDistribution: { high: number; medium: number; low: number; none: number; completed: { high: number; medium: number; low: number; none: number } };
  timeTracking: {
    totalEstimated: { hours: number; minutes: number };
    totalActual: { hours: number; minutes: number };
    avgEstimatedPerTask: { hours: number; minutes: number };
    avgActualPerTask: { hours: number; minutes: number };
    underEstimation: number;
    overEstimation: number;
  };
  listPerformance: any[];
  hourlyPattern: { hour: number; completed: number }[];
  streakData: { currentStreak: number; bestStreak: number; streakDates: string[] };
}

interface InsightData {
  insights: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    value: number;
    trend: 'up' | 'down' | 'neutral';
    icon: string;
  }>;
}

async function fetchComprehensiveAnalytics(range: string) {
  const res = await fetch(`/api/analytics/comprehensive?range=${range}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch analytics');
  return json.data;
}

async function fetchInsights(range: string) {
  const res = await fetch(`/api/analytics/insights?range=${range}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch insights');
  return json.data;
}

export function EnhancedAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'insights' | 'reports'>('overview');

  const { data: analytics, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['analytics-comprehensive', timeRange],
    queryFn: () => fetchComprehensiveAnalytics(timeRange),
  });

  const { data: insights, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['analytics-insights', timeRange],
    queryFn: () => fetchInsights(timeRange),
  });

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    try {
      const response = await fetch(`/api/export/analytics?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      if (format !== 'json') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics.${format === 'markdown' ? 'md' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        await response.json();
      }
      toast.success(`Analytics exported successfully`);
    } catch (error) {
      toast.error('Failed to export analytics');
    }
  };

  const isLoading = isLoadingAnalytics || isLoadingInsights;

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

  const data = analytics as AnalyticsData;
  const insightData = insights as InsightData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Productivity Analytics</h2>
          <p className="text-sm text-muted-foreground/60">
            Insights into your task completion and time management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAnalytics()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <div className="inline-flex items-center rounded-lg bg-muted/50 p-1">
            {(['day', 'week', 'month', 'quarter', 'year'] as const).map(range => (
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
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/50">
        <div className="flex gap-4">
          {(['overview', 'trends', 'insights', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-2 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && data && (
        <div className="space-y-6">
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
              <p className="text-3xl font-black">{data.summary.completionRate}%</p>
              <div className="w-full bg-muted/30 rounded-full h-1.5 mt-2">
                <div
                  className="bg-brand-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${data.summary.completionRate}%` }}
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
              <p className="text-3xl font-black">{data.summary.completed}</p>
              <p className="text-[11px] text-muted-foreground/60">out of {data.summary.total} tasks</p>
            </motion.div>

            <AvgCompletionTime
              hours={data.timeTracking.avgActualPerTask.hours}
              minutes={data.timeTracking.avgActualPerTask.minutes}
            />

            <ProductivityScore
              score={Math.round(data.summary.completionRate * 0.7 + (100 - data.summary.overdueRate) * 0.3)}
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompletionChart data={data.dailyCompletion} />
            <PriorityDistribution data={data.priorityDistribution} />
            <TimeTrackingChart data={data.timeTracking} />
            <ProductivityHeatmap data={data.dailyCompletion} />
          </div>
        </div>
      )}

      {activeTab === 'trends' && data && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Trend Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CompletionChart data={data.dailyCompletion} />
            <ProductivityHeatmap data={data.dailyCompletion} />
          </div>
        </div>
      )}

      {activeTab === 'insights' && insightData && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Actionable Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insightData.insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 rounded-xl p-4 border border-border/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{insight.title}</p>
                    <p className="text-base font-bold">{insight.description}</p>
                  </div>
                  <span className="text-2xl">{insight.icon}</span>
                </div>
                <div className="flex items-center gap-2 mt-3 text-sm">
                  <span className="text-lg font-bold">{insight.value}</span>
                  {insight.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  {insight.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold">Export Reports</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleExport('json')}
            >
              <Download className="w-5 h-5" />
              <span>JSON Export</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleExport('csv')}
            >
              <Download className="w-5 h-5" />
              <span>CSV Export</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleExport('markdown')}
            >
              <Download className="w-5 h-5" />
              <span>Markdown Report</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}