'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart3, Clock, TrendingUp, CalendarDays, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/date-range-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CSVLink } from '@/components/csv-export';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  endTime: string;
  duration: number;
  description: string;
}

interface TimeStats {
  totalMinutes: number;
  totalHours: number;
  entriesCount: number;
  byTask: { taskId: string; taskTitle: string; minutes: number }[];
  byDay: { date: string; minutes: number }[];
}

type Period = '7d' | '30d' | 'week' | 'month';

export function TimeTrackingReport() {
  const [period, setPeriod] = React.useState<Period>('30d');
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date } | undefined>();

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['time-entries', 'report', period, dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('period', period);
      if (dateRange?.from) params.set('from', format(dateRange.from, 'yyyy-MM-dd'));
      if (dateRange?.to) params.set('to', format(dateRange.to, 'yyyy-MM-dd'));

      const res = await fetch(`/api/time-entries?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Calculate stats
  const stats = React.useMemo((): TimeStats => {
    const totalMinutes = entries.reduce((sum: number, e: TimeEntry) => sum + e.duration, 0);
    const byTaskMap = new Map<string, { taskId: string; taskTitle: string; minutes: number }>();
    const byDayMap = new Map<string, number>();

    entries.forEach((entry: TimeEntry) => {
      // By task
      if (!byTaskMap.has(entry.taskId)) {
        byTaskMap.set(entry.taskId, { taskId: entry.taskId, taskTitle: entry.taskTitle, minutes: 0 });
      }
      byTaskMap.get(entry.taskId)!.minutes += entry.duration;

      // By day
      const day = format(new Date(entry.startTime), 'yyyy-MM-dd');
      byDayMap.set(day, (byDayMap.get(day) || 0) + entry.duration);
    });

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      entriesCount: entries.length,
      byTask: Array.from(byTaskMap.values()).sort((a, b) => b.minutes - a.minutes),
      byDay: Array.from(byDayMap.entries()).map(([date, minutes]) => ({ date, minutes })),
    };
  }, [entries]);

  const handleExport = () => {
    toast.success('Exporting time entries...');
  };

  const periodOptions: { value: Period; label: string }[] = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'week', label: 'This week' },
    { value: 'month', label: 'This month' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Tracking Report</h2>
          <p className="text-muted-foreground">Analyze your time investment across tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.entriesCount} time entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Entry</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(stats.totalMinutes / Math.max(stats.entriesCount, 1))}m
            </div>
            <p className="text-xs text-muted-foreground">
              per time entry
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Task</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.byTask[0]?.minutes ? Math.round(stats.byTask[0].minutes / 60) : 0}h
            </div>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {stats.byTask[0]?.taskTitle || 'No tasks yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* By Task */}
        <Card>
          <CardHeader>
            <CardTitle>Time by Task</CardTitle>
            <CardDescription>Where your time went</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byTask.slice(0, 5).map((item) => (
                <div key={item.taskId} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium line-clamp-1">{item.taskTitle}</span>
                      <span className="text-sm text-muted-foreground">{Math.round(item.minutes / 60)}h</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (item.minutes / Math.max(stats.totalMinutes, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Day */}
        <Card>
          <CardHeader>
            <CardTitle>Time by Day</CardTitle>
            <CardDescription>Daily distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.byDay.slice(-7).map((item) => (
                <div key={item.date} className="flex items-center gap-3">
                  <div className="w-20 text-sm text-muted-foreground">
                    {format(new Date(item.date), 'MMM d')}
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, (item.minutes / Math.max(stats.totalMinutes, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium w-16 text-right">
                    {Math.round(item.minutes / 60)}h
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}