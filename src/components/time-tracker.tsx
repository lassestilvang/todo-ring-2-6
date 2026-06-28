'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, StopCircle, Timer, Clock, Plus, BarChart3 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface TimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in minutes
  description: string;
  createdAt: string;
}

interface TimeTrackerProps {
  taskId: string;
  taskTitle: string;
}

export function TimeTracker({ taskId, taskTitle }: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Load existing time entries
  useEffect(() => {
    loadTimeEntries();
    loadReports();
  }, [taskId, selectedPeriod]);

  const loadTimeEntries = async () => {
    try {
      const res = await fetch(`/api/time-entries?taskId=${taskId}`);
      const json = await res.json();
      if (json.success) {
        setEntries(json.data);
      }
    } catch (error) {
      console.error('Failed to load time entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const res = await fetch(`/api/time-entries/reports?period=${selectedPeriod}&taskId=${taskId}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data.dailyReports || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  // Timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000 / 60));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const handleStart = () => {
    setStartTime(new Date());
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async () => {
    if (!startTime) return;

    setIsRunning(false);
    const duration = elapsed;

    try {
      const res = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          startTime: startTime.toISOString(),
          endTime: new Date().toISOString(),
          duration,
          description,
        }),
      });

      if (res.ok) {
        setElapsed(0);
        setDescription('');
        loadTimeEntries();
      }
    } catch (error) {
      console.error('Failed to save time entry:', error);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const totalTime = entries.reduce((sum, entry) => sum + entry.duration, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Time Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {formatDuration(isRunning ? elapsed : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {isRunning ? 'Running' : 'Paused'}
            </p>
          </div>

          <div className="flex gap-2">
            {!isRunning && elapsed === 0 && (
              <Button onClick={handleStart} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Timer
              </Button>
            )}
            {isRunning && (
              <>
                <Button variant="outline" onClick={handlePause}>
                  <Pause className="w-4 h-4" />
                </Button>
                <Button onClick={handleStop}>
                  <StopCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            {!isRunning && elapsed > 0 && (
              <Button onClick={handleStart} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isRunning}
          />
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Time Entries</h4>
            <span className="text-sm text-muted-foreground">
              Total: {formatDuration(totalTime)}
            </span>
          </div>

          {/* Reports Section */}
          {reports.length > 0 && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Time Report ({selectedPeriod})
                </h5>
                <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
                  <SelectTrigger className="w-20 h-7">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Total Time</span>
                  <p className="font-medium">{formatDuration(reports.reduce((s, r) => s + r.totalMinutes, 0))}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Days Tracked</span>
                  <p className="font-medium">{reports.length}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground/60 text-center py-4">
              No time entries yet
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div class="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.description || 'No description'}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.startTime), 'HH:mm')} - {entry.endTime && format(new Date(entry.endTime), 'HH:mm')}
                    </p>
                  </div>
                  <span className="text-sm font-medium ml-2">{formatDuration(entry.duration)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}