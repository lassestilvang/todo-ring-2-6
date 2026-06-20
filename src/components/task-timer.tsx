'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  initialHours?: number;
  initialMinutes?: number;
  onTimeUpdate: (hours: number, minutes: number) => void;
  className?: string;
}

export function TaskTimer({
  initialHours = 0,
  initialMinutes = 0,
  onTimeUpdate,
  className,
}: TaskTimerProps) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    const totalMinutes = Math.round(elapsed / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    onTimeUpdate(initialHours + hours, initialMinutes + minutes);
    setElapsed(0);
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="font-mono text-lg font-bold tabular-nums">
        {formatTime(elapsed)}
      </div>
      <div className="flex items-center gap-1">
        {!isRunning ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStart}
            className="h-7 w-7 p-0"
          >
            <Play className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            className="h-7 w-7 p-0"
          >
            <Pause className="w-4 h-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleStop}
          disabled={elapsed === 0}
          className="h-7 w-7 p-0"
        >
          <StopCircle className="w-4 h-4" />
        </Button>
      </div>

      <div className="text-xs text-muted-foreground/60">
        Total: {initialHours}h {initialMinutes}m
      </div>
    </div>
  );
}