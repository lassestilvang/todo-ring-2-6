'use client';

import * as React from 'react';
import { Home, Calendar, BarChart3, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomBarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onAddTask?: () => void;
}

export function MobileBottomBar({
  activeTab = 'today',
  onTabChange,
  onAddTask,
}: MobileBottomBarProps) {
  const tabs = [
    { id: 'today', label: 'Today', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2">
        {/* Add button in center */}
        <button
          onClick={onAddTask}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 -translate-y-6"
          aria-label="Add task"
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Navigation tabs */}
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center w-16 h-12 rounded-lg transition-all',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground/60'
              )}
              aria-label={tab.label}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground/60'
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}