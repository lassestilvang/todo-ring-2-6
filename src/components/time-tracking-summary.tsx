'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, PlayCircle, PauseCircle, StopCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  description: string;
}

interface TimeTrackingData {
  totalTime: { hours: number; minutes: number };
  todayTime: { hours: number; minutes: number };
  activeSessions: number;
  recentEntries: TimeEntry[];
}

async function fetchTimeTrackingData(): Promise<TimeTrackingData> {
  const res = await fetch('/api/time-tracking/summary');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch time tracking data');
  return json.data;
}

export function TimeTrackingSummary() {
  const { data: timeData, isLoading } = useQuery({
    queryKey: ['time-tracking-summary'],
    queryFn: fetchTimeTrackingData,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  if (isLoading) {
    return <div className="space-y-3">
      <div className="h-4 bg-muted rounded animate-pulse" />
      <div className="h-12 bg-muted rounded animate-pulse" />
      <div className="h-20 bg-muted rounded animate-pulse" />
    </div>;
  }

  const totalHours = timeData?.totalTime?.hours ?? 0;
  const totalMinutes = timeData?.totalTime?.minutes ?? 0;
  const todayHours = timeData?.todayTime?.hours ?? 0;
  const todayMinutes = timeData?.todayTime?.minutes ?? 0;

  return (
    <div className="space-y-4">
      {/* Total Time */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
          Total Tracked Time
        </p>
        <p className="text-3xl font-bold">
          {totalHours}h {totalMinutes}m
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Today: {todayHours}h {todayMinutes}m
        </p>
      </div>

      {/* Active Sessions */}
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <PlayCircle className="w-5 h-5 mx-auto mb-1 text-blue-500" />
          <p className="text-xs text-muted-foreground/60">Active Sessions</p>
          <p className="text-xl font-bold">{timeData?.activeSessions ?? 0}</p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <BarChart3 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
          <p className="text-xs text-muted-foreground/60">Avg Session</p>
          <p className="text-xl font-bold">
            {timeData?.totalTime?.hours && timeData.totalTime.hours > 0
              ? `${Math.round((totalMinutes / (timeData.activeSessions || 1)) * 60 + totalHours)}m`
              : `${totalMinutes || 0}m`}
          </p>
        </div>
      </div>

      {/* Recent Entries */}
      {timeData?.recentEntries && timeData.recentEntries.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">
            Recent Entries
          </p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {timeData.recentEntries.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
              >
                <span className="truncate flex-1">{entry.description || 'Time entry'}</span>
                <span className="text-muted-foreground/60 ml-2">
                  {entry.duration}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}