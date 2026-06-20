'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, Play, Pause, SkipForward, RotateCcw, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PomodoroTimerProps {
  taskId: string;
  onComplete?: (timeSpent: { hours: number; minutes: number }) => void;
  className?: string;
}

const DEFAULT_WORK_DURATION = 25; // minutes
const DEFAULT_BREAK_DURATION = 5; // minutes

export function PomodoroTimer({ taskId, onComplete, className }: PomodoroTimerProps) {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = React.useState(false);
  const [isBreak, setIsBreak] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState(DEFAULT_WORK_DURATION * 60);
  const [completedCount, setCompletedCount] = React.useState(0);

  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch current task time tracking
  const { data: task } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?id=${taskId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  React.useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, timeLeft]);

  const handleTimerComplete = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (isBreak) {
      // Break is over, start work session
      setIsBreak(false);
      setTimeLeft(DEFAULT_WORK_DURATION * 60);
      setIsActive(false);
      setCompletedCount(prev => prev + 1);
    } else {
      // Work session is over, start break
      setIsBreak(true);
      setTimeLeft(DEFAULT_BREAK_DURATION * 60);
      setIsActive(true);
      
      // Show break notification
      toast.success('Work session complete! Take a break.');
    }
  };

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  const resetTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(DEFAULT_WORK_DURATION * 60);
    setCompletedCount(0);
  };

  const skipSession = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    if (isBreak) {
      setIsBreak(false);
      setCompletedCount(prev => prev + 1);
    }
    setTimeLeft(DEFAULT_WORK_DURATION * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((DEFAULT_BREAK_DURATION * 60 - timeLeft) / (DEFAULT_BREAK_DURATION * 60)) * 100
    : ((DEFAULT_WORK_DURATION * 60 - timeLeft) / (DEFAULT_WORK_DURATION * 60)) * 100;

  return (
    <Card className={cn("border-brand-500/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-brand-500" />
            Pomodoro Timer
          </span>
          <div className="text-xs">
            <span className={cn(
              "px-2 py-1 rounded",
              isBreak ? "bg-amber-500/10 text-amber-600" : "bg-brand-500/10 text-brand-600"
            )}>
              {isBreak ? 'Break' : 'Work'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={352}
              strokeDashoffset={352 - (352 * progress) / 100}
              className={cn(
                "transition-all duration-1000",
                isBreak ? "text-amber-500" : "text-brand-500"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold tabular-nums">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-[10px] text-muted-foreground uppercase">Pomodoros</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{task ? 
              Math.floor((task.actualHours || 0) + (task.actualMinutes || 0) / 60) 
              : 0
            }</p>
            <p className="text-[10px] text-muted-foreground uppercase">Hours</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          {!isActive ? (
            <Button variant="ghost" size="sm" onClick={startTimer}>
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={pauseTimer}>
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={resetTimer}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          <Button variant="ghost" size="sm" onClick={skipSession}>
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>
        </div>

        {/* Quick Add Time */}
        <div className="border-t border-border/50 pt-4">
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mb-2">Quick Add</p>
          <div className="flex gap-2">
            {[15, 30, 45, 60].map(minutes => (
              <Button
                key={minutes}
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/tasks', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: taskId,
                        actualMinutes: (task?.actualMinutes || 0) + minutes,
                      }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
                      toast.success(`${minutes}m added`);
                    }
                  } catch {
                    toast.error('Failed to add time');
                  }
                }}
              >
                +{minutes}m
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
