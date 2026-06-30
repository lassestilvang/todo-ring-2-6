/**
 * Performance Dashboard Component
 * Displays application performance metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, Clock, Database, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceData {
  operations: Record<string, {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  }>;
  cache: {
    hits: number;
    misses: number;
    size: number;
  } | null;
}

async function fetchPerformanceData(period: string): Promise<PerformanceData> {
  const res = await fetch(`/api/performance?period=${period}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch performance data');
  return json.data;
}

export function PerformanceDashboard() {
  const [period, setPeriod] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['performance', period],
    queryFn: () => fetchPerformanceData(period),
    refetchInterval: autoRefresh ? 10000 : false,
  });

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${ms.toFixed(2)}ms`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getOperationColor = (name: string) => {
    if (name.includes('db')) return 'text-blue-500';
    if (name.includes('api')) return 'text-green-500';
    if (name.includes('render')) return 'text-purple-500';
    return 'text-orange-500';
  };

  if (isLoading && !data) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="30m">Last 30 minutes</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Cache Stats */}
      {data?.cache && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} />
              <span className="text-sm font-medium">Cache Hits</span>
            </div>
            <div className="text-2xl font-bold">{data.cache.hits}</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} />
              <span className="text-sm font-medium">Cache Misses</span>
            </div>
            <div className="text-2xl font-bold">{data.cache.misses}</div>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} />
              <span className="text-sm font-medium">Hit Rate</span>
            </div>
            <div className="text-2xl font-bold">
              {data.cache.hits + data.cache.misses > 0
                ? Math.round((data.cache.hits / (data.cache.hits + data.cache.misses)) * 100)
                : 0}%
            </div>
          </div>
        </div>
      )}

      {/* Operation Stats */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Operation Performance</h3>
        <div className="grid gap-4">
          {data && Object.entries(data.operations).map(([name, stats]) => (
            <div key={name} className="bg-card rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} />
                  <span className="font-medium">{name}</span>
                </div>
                <span className={cn('text-sm font-medium', getOperationColor(name))}>
                  {formatDuration(stats.avg)} avg
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Count</span>
                  <div className="font-medium">{stats.count}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Min</span>
                  <div className="font-medium">{formatDuration(stats.min)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Max</span>
                  <div className="font-medium">{formatDuration(stats.max)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">P95</span>
                  <div className="font-medium">{formatDuration(stats.p95)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}