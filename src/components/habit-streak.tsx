'use client';

import { motion } from 'framer-motion';
import { Flame, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitStreakProps {
  currentStreak: number;
  longestStreak: number;
  isActive?: boolean;
}

export function HabitStreak({
  currentStreak,
  longestStreak,
  isActive = true,
}: HabitStreakProps) {
  // Calculate streak level (for visual feedback)
  const getStreakLevel = (streak: number) => {
    if (streak >= 30) return 'legendary';
    if (streak >= 14) return 'master';
    if (streak >= 7) return 'expert';
    if (streak >= 3) return 'intermediate';
    return 'beginner';
  };

  const level = getStreakLevel(currentStreak);
  const levelColors = {
    beginner: 'from-orange-400 to-red-500',
    intermediate: 'from-orange-500 to-pink-500',
    expert: 'from-purple-500 to-indigo-500',
    master: 'from-yellow-400 to-orange-500',
    legendary: 'from-yellow-500 to-red-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-3 rounded-2xl px-4 py-2.5 shadow-lg',
        isActive
          ? 'bg-gradient-to-r text-white'
          : 'bg-muted/50 text-muted-foreground',
        isActive && levelColors[level]
      )}
    >
      <div className="flex items-center gap-2">
        <Flame className={cn(
          'w-5 h-5',
          isActive ? 'text-white/90' : 'text-orange-500'
        )} />
        <span className={cn(
          'font-bold text-lg tabular-nums',
          isActive ? 'text-white' : 'text-foreground'
        )}>
          {currentStreak}
        </span>
      </div>

      {longestStreak > currentStreak && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs opacity-80">
          <TrendingUp className="w-3 h-3" />
          <span>Best: {longestStreak}</span>
        </div>
      )}

      {level !== 'beginner' && isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
          className="hidden sm:block px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full uppercase tracking-wider"
        >
          {level}
        </motion.div>
      )}
    </motion.div>
  );
}

// Streak badge for task cards
export function StreakBadge({ streak }: { streak: number }) {
  if (streak < 1) return null;

  const colors = [
    'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400',
    'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-400',
    'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
    'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-500 dark:bg-yellow-950/30 dark:text-yellow-400',
  ];

  const colorIndex = Math.min(Math.floor(streak / 3), colors.length - 1);

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium',
        colors[colorIndex]
      )}
    >
      <Flame className="w-3 h-3" />
      <span className="font-bold">{streak}</span>
      <span className="opacity-60">day streak</span>
    </motion.span>
  );
}