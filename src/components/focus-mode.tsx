'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, X, Focus, Music, Waves, Brain, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { Task } from '@/types/index';

interface FocusModeProps {
  task?: Task;
  onClose: () => void;
}

type FocusModeState = 'idle' | 'focused' | 'paused' | 'completed';
type AmbientSound = 'none' | 'rain' | 'waves' | 'coffee' | 'white';

const POMODORO_DURATION = 25 * 60; // 25 minutes in seconds
const LONG_BREAK = 15 * 60; // 15 minutes

const AMBIENT_SOUNDS: { id: AmbientSound; name: string; icon: React.ReactNode }[] = [
  { id: 'none', name: 'None', icon: <X className="w-4 h-4" /> },
  { id: 'rain', name: 'Rain', icon: <Waves className="w-4 h-4" /> },
  { id: 'waves', name: 'Ocean Waves', icon: <Waves className="w-4 h-4" /> },
  { id: 'coffee', name: 'Coffee Shop', icon: <Music className="w-4 h-4" /> },
  { id: 'white', name: 'White Noise', icon: <Waves className="w-4 h-4" /> },
];

export function FocusMode({ task, onClose }: FocusModeProps) {
  const [state, setState] = useState<FocusModeState>('idle');
  const [timeLeft, setTimeLeft] = useState(POMODORO_DURATION);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isLongBreak, setIsLongBreak] = useState(false);
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none');
  const [soundVolume, setSoundVolume] = useState([50]);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state === 'focused' || state === 'paused') {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const handleStart = useCallback(() => {
    setState('focused');
  }, []);

  const handlePause = useCallback(() => {
    setState('paused');
  }, []);

  const handleResume = useCallback(() => {
    setState('focused');
  }, []);

  const handleSkip = useCallback(() => {
    if (isLongBreak) {
      setTimeLeft(POMODORO_DURATION);
      setIsLongBreak(false);
    } else {
      setCompletedPomodoros(prev => prev + 1);
      if (completedPomodoros >= 3) {
        setIsLongBreak(true);
        setTimeLeft(LONG_BREAK);
        setCompletedPomodoros(0);
      } else {
        setTimeLeft(POMODORO_DURATION);
      }
    }
    setState('focused');
  }, [completedPomodoros, isLongBreak]);

  const handleComplete = useCallback(() => {
    setState('completed');
  }, []);

  const handleReset = useCallback(() => {
    setState('idle');
    setTimeLeft(POMODORO_DURATION);
    setCompletedPomodoros(0);
    setIsLongBreak(false);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((POMODORO_DURATION - timeLeft) / POMODORO_DURATION) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-md"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-8 bg-card/95 backdrop-blur-xl border-none shadow-2xl rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Focus className="w-5 h-5 text-brand-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Focus Mode</h2>
                  <p className="text-sm text-muted-foreground">Pomodoro Timer</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Task Info */}
            {task && (
              <div className="mb-6 p-4 bg-muted/30 rounded-xl">
                <h3 className="font-semibold mb-1">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            )}

            {/* Timer */}
            <div className="text-center mb-8">
              <div className="relative w-40 h-40 mx-auto mb-4">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-muted/30"
                  />
                  <motion.circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={440}
                    strokeDashoffset={440 - (440 * progress) / 100}
                    className="text-brand-500"
                    animate={state === 'focused' ? { strokeDashoffset: 440 - (440 * progress) / 100 } : undefined}
                    transition={{ duration: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold font-mono">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {isLongBreak ? 'Long Break' : 'Pomodoro'} • {completedPomodoros}/4 completed
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {state === 'idle' && (
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleStart}
                  className="px-8 shadow-lg shadow-brand-500/20"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Focus Session
                </Button>
              )}

              {(state === 'focused' || state === 'paused') && (
                <>
                  <Button variant="ghost" size="icon" onClick={state === 'focused' ? handlePause : handleResume}>
                    {state === 'focused' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleSkip}>
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </>
              )}

              {state === 'completed' && (
                <Button variant="default" size="lg" onClick={handleReset}>
                  Start Again
                </Button>
              )}
            </div>

            {/* Focus Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/30 rounded-xl">
                <Target className="w-4 h-4 mx-auto mb-1 text-brand-500" />
                <p className="text-2xl font-bold">{completedPomodoros}</p>
                <p className="text-[10px] text-muted-foreground/60">Completed</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl">
                <Brain className="w-4 h-4 mx-auto mb-1 text-brand-500" />
                <p className="text-sm font-medium">{isLongBreak ? 'Break' : 'Focus'}</p>
                <p className="text-[10px] text-muted-foreground/60">Mode</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl">
                <Music className="w-4 h-4 mx-auto mb-1 text-brand-500" />
                <p className="text-sm font-medium">{ambientSound === 'none' ? 'Silent' : ambientSound}</p>
                <p className="text-[10px] text-muted-foreground/60">Sound</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>Tip: Complete 4 pomodoros to earn a long break!</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}