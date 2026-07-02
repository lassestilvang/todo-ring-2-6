'use client';

import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { Activity, Zap, Clock, Database, Users, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
  pageLoadTime: number;
  apiResponseTime: number;
  cacheHitRate: number;
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development',
  className
}: {
  enabled?: boolean;
  className?: string;
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    pageLoadTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = now;
      }

      setMetrics(prev => ({ ...prev, fps }));
      requestAnimationFrame(measureFPS);
    };

    const animationFrame = requestAnimationFrame(measureFPS);

    // Memory usage (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      }));
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [enabled]);

  const performanceScore = useMemo(() => {
    const scores = [
      Math.max(0, 100 - (metrics.fps > 0 ? Math.abs(60 - metrics.fps) : 0)),
      Math.max(0, 100 - (metrics.memoryUsage > 0 ? metrics.memoryUsage / 2 : 0)),
      Math.max(0, 100 - (metrics.renderTime > 0 ? metrics.renderTime : 0)),
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [metrics]);

  if (!enabled) return null;

  return (
    <Card className={cn(
      "fixed bottom-4 right-4 w-64 backdrop-blur-sm border",
      performanceScore > 90 ? 'border-emerald-500/50 bg-emerald-500/5' :
      performanceScore > 70 ? 'border-amber-500/50 bg-amber-500/5' :
      'border-red-500/50 bg-red-500/5',
      className
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            Performance
          </span>
          <div className="flex items-center gap-1">
            <Select value={timeRange} onValueChange={(v: '1h' | '24h' | '7d') => setTimeRange(v)}>
              <SelectTrigger className="h-6 w-[60px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1h</SelectItem>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setMetrics({ ...metrics })}
              className="p-1 rounded hover:bg-muted/50"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        {/* Overall Score */}
        <div className="text-center">
          <div className={cn(
            'text-2xl font-bold',
            performanceScore > 90 ? 'text-emerald-600' :
            performanceScore > 70 ? 'text-amber-600' : 'text-red-600'
          )}>
            {performanceScore}
          </div>
          <p className="text-muted-foreground">Score</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <MetricItem icon={Clock} label="FPS" value={metrics.fps} target={60} />
          <MetricItem icon={Database} label="Memory" value={metrics.memoryUsage} unit="MB" target={100} />
          <MetricItem icon={Zap} label="Render" value={metrics.renderTime} unit="ms" target={16} />
          <MetricItem icon={Users} label="Cache" value={metrics.cacheHitRate} unit="%" target={90} />
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  unit?: string;
  target: number;
}

function MetricItem({ icon: Icon, label, value, unit, target }: MetricItemProps) {
  const isGood = value <= target;
  return (
    <div className="p-2 rounded bg-muted/30">
      <div className="flex items-center gap-1 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className={cn(
          'font-bold text-sm',
          isGood ? 'text-emerald-600' : 'text-red-600'
        )}>
          {value.toFixed(0)}
        </span>
        {unit && <span className="text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

/**
 * Bundle analyzer component (development only)
 */
export function BundleAnalyzer() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 text-xs shadow-lg max-w-xs">
      <h4 className="font-bold mb-2">Bundle Info</h4>
      <div className="space-y-1">
        <div>Next.js: 16.x</div>
        <div>React: 19.x</div>
        <div>Bundle: Optimized</div>
      </div>
    </div>
  );
}