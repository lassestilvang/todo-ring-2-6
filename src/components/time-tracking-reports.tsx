'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, TrendingUp, PieChart, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatMinutes } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

interface TimeTrackingReportsProps {
  className?: string;
}

export function TimeTrackingReports({ className }: TimeTrackingReportsProps) {
  const [period, setPeriod] = React.useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('week');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['time-tracking', period],
    queryFn: async () => {
      const res = await fetch(`/api/time-tracking?period=${period}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

  const pieData = stats?.byList ? Object.entries(stats.byList).map(([name, data]: [string, any]) => ({
    name: name === 'inbox' ? 'Inbox' : name,
    value: data.actual,
  })) : [];

  const handleExport = () => {
    if (!stats) return;
    const csv = [
      ['Date', 'Estimated (min)', 'Actual (min)', 'Completed'],
      ...Object.entries(stats.daily || {}).map(([date, data]: [string, any]) => [
        date,
        data.estimated,
        data.actual,
        data.completed,
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-tracking-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted/30 rounded mb-2" />
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted/20 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand-500" />
              Time Tracking Reports
            </span>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger className="h-8 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="quarter">Quarter</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{formatMinutes(stats?.summary?.totalActualMinutes || 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Time Spent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatMinutes(stats?.summary?.totalEstimatedMinutes || 0)}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Estimated</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.summary?.totalTasks || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Tasks</p>
            </div>
            <div className="text-center">
              <p className={cn(
                "text-2xl font-bold",
                (stats?.summary?.efficiency || 0) > 100 ? "text-amber-500" : "text-emerald-500"
              )}>
                {stats?.summary?.efficiency || 0}%
              </p>
              <p className="text-[10px] text-muted-foreground uppercase">Efficiency</p>
            </div>
          </div>

          {/* Daily Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Daily Breakdown
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(stats?.daily || {}).map(([date, data]: [string, any]) => ({
                  date: date.slice(5),
                  estimated: data.estimated,
                  actual: data.actual,
                }))}>
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip formatter={(v) => [`${v} min`, '']} />
                  <Legend />
                  <Bar dataKey="estimated" name="Estimated" fill="#3b82f6" />
                  <Bar dataKey="actual" name="Actual" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Time by List
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
