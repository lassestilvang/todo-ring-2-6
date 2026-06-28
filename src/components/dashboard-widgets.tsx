'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, Target, TrendingUp, Award, Settings, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WidgetConfig {
  id: string;
  type: 'streak' | 'productivity' | 'time-tracking' | 'upcoming' | 'recent-activity' | 'completed';
  title: string;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
}

const defaultWidgets: WidgetConfig[] = [
  { id: 'streak', type: 'streak', title: 'Habit Streak', size: 'small', enabled: true },
  { id: 'productivity', type: 'productivity', title: 'Productivity Score', size: 'small', enabled: true },
  { id: 'upcoming', type: 'upcoming', title: 'Upcoming Tasks', size: 'medium', enabled: true },
  { id: 'time-tracking', type: 'time-tracking', title: 'Time Tracking', size: 'medium', enabled: true },
  { id: 'recent-activity', type: 'recent-activity', title: 'Recent Activity', size: 'large', enabled: false },
  { id: 'completed', type: 'completed', title: 'Completed Tasks', size: 'small', enabled: true },
];

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  streak: <Award className="w-4 h-4" />,
  productivity: <Target className="w-4 h-4" />,
  'time-tracking': <Clock className="w-4 h-4" />,
  upcoming: <Calendar className="w-4 h-4" />,
  'recent-activity': <List className="w-4 h-4" />,
  completed: <TrendingUp className="w-4 h-4" />,
};

const WIDGET_TYPES = [
  { id: 'streak', name: 'Habit Streak', size: 'small' },
  { id: 'productivity', name: 'Productivity Score', size: 'small' },
  { id: 'upcoming', name: 'Upcoming Tasks', size: 'medium' },
  { id: 'time-tracking', name: 'Time Tracking', size: 'medium' },
  { id: 'recent-activity', name: 'Recent Activity', size: 'large' },
  { id: 'completed', name: 'Completed Tasks', size: 'small' },
];

async function fetchDashboardData() {
  const res = await fetch('/api/analytics/dashboard?range=30d');
  const json = await res.json();
  return json.success ? json.data : {};
}

export function DashboardWidgets() {
  const [widgets, setWidgets] = React.useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    refetchInterval: 60000,
  });

  const enabledWidgets = widgets.filter(w => w.enabled);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _updateWidget = (id: string, updates: Partial<WidgetConfig>) => {
    const newWidgets = widgets.map(w => w.id === id ? { ...w, ...updates } : w);
    setWidgets(newWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
  };

  const addWidget = (type: string) => {
    const template = WIDGET_TYPES.find(t => t.id === type);
    if (!template) return;

    const newWidget: WidgetConfig = {
      id: `${template.id}-${Date.now()}`,
      type: template.id as any,
      title: template.name,
      size: template.size as 'small' | 'medium' | 'large',
      enabled: true,
    };
    setWidgets([...widgets, newWidget]);
    localStorage.setItem('dashboard-widgets', JSON.stringify([...widgets, newWidget]));
  };

  const removeWidget = (id: string) => {
    const newWidgets = widgets.filter(w => w.id !== id);
    setWidgets(newWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(newWidgets));
  };

  const resetWidgets = () => {
    setWidgets(defaultWidgets);
    localStorage.setItem('dashboard-widgets', JSON.stringify(defaultWidgets));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Customize
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Customize Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Add Widget</h4>
                <div className="grid grid-cols-2 gap-2">
                  {WIDGET_TYPES.filter(t => !widgets.some(w => w.type === t.id)).map((type) => (
                    <Button
                      key={type.id}
                      variant="outline"
                      size="sm"
                      onClick={() => addWidget(type.id)}
                    >
                      {WIDGET_ICONS[type.id]}
                      <span className="ml-2 text-xs">{type.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Button variant="ghost" size="sm" onClick={resetWidgets}>
                  Reset to Default
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className={cn(
        'grid gap-4',
        'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      )}>
        {enabledWidgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              'bg-card/50 rounded-xl p-4 border border-border/50',
              widget.size === 'large' ? 'sm:col-span-2 lg:col-span-2' : ''
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {WIDGET_ICONS[widget.type]}
                {widget.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWidget(widget.id)}
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <WidgetContent widget={widget} data={dashboardData?.[widget.type]} />
          </motion.div>
        ))}
      </div>

      {enabledWidgets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No widgets configured</p>
          <Button variant="link" onClick={() => addWidget('streak')}>
            Add your first widget
          </Button>
        </div>
      )}
    </div>
  );
}

function WidgetContent({ widget, data }: { widget: WidgetConfig; data: any }) {
  switch (widget.type) {
    case 'streak':
      return (
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
            {widget.title}
          </p>
          <p className="text-2xl font-bold text-orange-500">{data?.currentStreak || 0}</p>
          <p className="text-xs text-muted-foreground/60">day streak</p>
        </div>
      );

    case 'productivity':
      const rate = data?.completionRate || 0;
      return (
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
            {widget.title}
          </p>
          <p className="text-2xl font-bold">{rate}%</p>
          <p className="text-xs text-muted-foreground/60">completion rate</p>
        </div>
      );

    case 'time-tracking':
      return (
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
            {widget.title}
          </p>
          <p className="text-2xl font-bold">
            {data?.totalTime?.hours || 0}h {data?.totalTime?.minutes || 0}m
          </p>
          <p className="text-xs text-muted-foreground/60">time tracked</p>
        </div>
      );

    case 'upcoming':
      return (
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
            {widget.title}
          </p>
          <div className="space-y-1">
            {(data?.upcomingTasks || []).slice(0, 3).map((task: any, i: number) => (
              <div key={i} className="text-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="truncate">{task.title}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'recent-activity':
      return (
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-2">
            {widget.title}
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {(data?.recentActivity || []).slice(0, 5).map((item: any, i: number) => (
              <div key={i} className="text-sm">
                <span className="font-medium">{item.action}</span>
                <span className="text-muted-foreground/60"> - {item.fieldChanged}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'completed':
      return (
        <div>
          <p className="text-xs text-muted-foreground/60 uppercase tracking-wider mb-1">
            {widget.title}
          </p>
          <p className="text-2xl font-bold text-emerald-500">{data?.completed || 0}</p>
          <p className="text-xs text-muted-foreground/60">tasks completed</p>
        </div>
      );

    default:
      return (
        <div>
          <p className="text-sm text-muted-foreground">{widget.title}</p>
        </div>
      );
  }
}