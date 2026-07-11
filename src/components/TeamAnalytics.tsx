import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLiveRegion } from '@/hooks/useAccessibility';

/**
 * Team Analytics Dashboard Component
 */
export function TeamAnalytics({ teamId }: { teamId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['team-analytics', teamId],
    queryFn: () => fetchTeamAnalytics(teamId),
    refetchInterval: 300000 // 5 minutes
  });

  const containerRef = useFocusTrap();
  const announce = useLiveRegion().announce;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div className="animate-spin">
          <svg className="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500" role="alert">
        {error.message}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8 text-muted-foreground/50">
        <p>No analytics data available for this team.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/50 p-6 lag-600 dark:bg-gray-800",
        "prose lg:prose-lg lg:pt-8 lg:pb-16 lg:br-2 lg:rounded-md mb-6"
      )}
      ref={containerRef}
    >
      <SkipLink />

      <h2 className="font-bold text-xl mb-6">Team Analytics Dashboard</h2>

      {/* Workload Distribution */}
      <section className="mb-8">
        <h3 className="font-medium text-lg mb-4">Workload Distribution</h3>
        <BarChart
          width={600}
          height={300}
          data={data.workloadDistribution}
          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="userId" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="assignedTasks" fill="#8884d8" name="Assigned Tasks" />
          <Bar dataKey="capacity" fill="#82ca9d" name="Capacity" />
        </BarChart>
      </section>

      {/* Utilization Heatmap */}
      <section className="mb-8">
        <h3 className="font-medium text-lg mb-4">Utilization Heatmap</h3>
        <div className="grid grid-cols-4 gap-2">
          {data.workloadDistribution.map((user) => (
            <div
              key={user.userId}
              className={cn(
                "p-3 rounded border",
                user.utilization > 0.9 ? "bg-red-100" :
                user.utilization > 0.8 ? "bg-yellow-100" :
                "bg-green-100"
              )}
              role="img"
              aria-label={`${user.userId}: ${Math.round(user.utilization * 100)}% utilization`}
            >
              <div className="font-medium">{user.userId}</div>
              <div className="text-sm">{Math.round(user.utilization * 100)}%</div>
            </div>
          ))}
        </div>
      </section>

      {/* Velocity Metrics */}
      <section className="mb-8">
        <h3 className="font-medium text-lg mb-4">Velocity Metrics</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground/50">Tasks Completed</div>
            <div className="text-2xl font-bold">{data.velocityMetrics.tasksCompleted}</div>
          </div>
          <div className="p-4 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground/50">Avg Completion Time</div>
            <div className="text-2xl font-bold">{data.velocityMetrics.avgCompletionTime}h</div>
          </div>
          <div className="p-4 bg-muted/20 rounded-lg">
            <div className="text-xs text-muted-foreground/50">Trend</div>
            <div className="text-xl font-bold">{data.velocityMetrics.trend}</div>
          </div>
        </div>
      </section>

      {/* Overload Warnings */}
      {data.overloadWarnings.length > 0 && (
        <section className="mb-8">
          <h3 className="font-medium text-lg mb-4">Overload Warnings</h3>
          <div className="space-y-3">
            {data.overloadWarnings.map((warning, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded border",
                  warning.severity === "high" ? "bg-red-50 border-red-200" :
                  warning.severity === "medium" ? "bg-yellow-50 border-yellow-200" :
                  "bg-green-50 border-green-200"
                )}
                role="alert"
                aria-live="polite"
                aria-label={`${warning.severity} severity warning: ${warning.warnings.join(', ')}`}
              >
                <div className="font-medium text-red-600">
                  {warning.userId}
                </div>
                <ul className="list-disc pl-5 mt-2 text-sm">
                  {warning.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Capacity Forecast */}
      <section>
        <h3 className="font-medium text-lg mb-4">Capacity Forecast</h3>
        <PieChart width={400} height={250}>
          <Pie
            data={[
              { name: 'Next Week', value: data.capacityForecast.nextWeek * 100 },
              { name: 'Available', value: (1 - data.capacityForecast.nextWeek) * 100 }
            ]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            labelLine={false}
            label={({ name, percent }) => (
              <div className="text-sm font-medium">
                {name}: {percent.toFixed(0)}%
              </div>
            )}
          >
            {[
              { name: 'Next Week', color: '#8884d8' },
              { name: 'Available', color: '#82ca9d' }
            ].map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </section>
    </div>
  );
}