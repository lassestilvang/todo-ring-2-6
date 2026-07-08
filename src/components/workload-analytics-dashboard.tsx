'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
  Badge,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DailyCapacity {
  day: string;
  totalHours: number;
}

interface MemberWorkload {
  id: string;
  name: string;
  role: string;
  capacityHours: number;
  avgUtilization: number;
  tasks: {
    id: string;
    title: string;
    dueDate?: string;
    status: string;
  }[];
}

interface WorkloadAnalyticsData {
  dailyCapacity: DailyCapacity[];
  members: MemberWorkload[];
  calendar: Array<{
    date: string;
    hours: Record<string, number>;
  }>;
}

export function WorkloadAnalyticsDashboard() {
  const { data: workloadData, isLoading } = useQuery({
    queryKey: ['analytics', 'workload'],
    queryFn: async () => {
      const res = await fetch('/api/analytics/team-workload');
      const json = await res.json();
      return json.data || null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Progress className="h-4 w-64" />
      </div>
    );
  }

  if (!workloadData) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 flex justify-center items-center gap-2">
          <span className="text-2xl">📊</span>
          <span>No workload data available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Weekly Overview Stats */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-lg font-medium">Weekly Capacity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {workloadData.dailyCapacity.map((entry) => (
              <div key={entry.day} className="rounded bg-gray-100 p-3 flex items-center justify-between text-sm">
                <span className="font-medium">{entry.day}</span>
                <span className="font-medium text-blue-600">{entry.totalHours}h</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Member Cards */}
        {workloadData.members.map((member) => (
          <Card key={member.id}>
            <CardHeader className="py-2">
              <CardTitle className="font-medium flex items-center justify-between">
                <span>{member.name}</span>
                <Badge status={member.status} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Role: {member.role}</span>
                <span>Capacity: {member.capacityHours}h/day</span>
              </div>
              <div className="space-y-1">
                <span>Average Utilization: {Math.round(member.avgUtilization)}%</span>
                <Progress value={member.avgUtilization} className="h-2" />
              </div>
              <div className="space-y-1">
                {member.tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="text-sm text-gray-700 group relative">
                    <span>{task.title}</span>
                    {[task.dueDate && (
                      <span className="absolute -top-2 -right-2 badge rounded px-2 py-1 text-[10px] bg-gray-200">
                        Due {new Date(task.dueDate!).toLocaleDateString()}
                      </span>
                    )]}
                    {task.status === 'in_progress' && (
                      <span className="absolute -top-3 -right-3 rounded-full w-3 h-3 bg-amber-500 group/badgeanimate" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Card)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Workload Distribution Chart */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col">
            <div className="text-lg font-medium mb-2">Workload Distribution</div>
            <div className="relative h-48 bg-gray-100 rounded overflow-hidden">
              <div className="flex h-full">
                {[...Array(12)].map((_, i) => {
                  const hour = i / 11;
                  const intensity = Math.random() > 0.7 ? 1 : 0.5;
                  const color = intensity > 0.5 ? 'bg-green-100' : 'bg-blue-100';
                  return (
                    <div
                      key={i}
                      className={[color, 'w-1 rounded-tail', 'hover:bg-green-200 transition-all']}
                      style={{ height: `${hour * 100}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex flex-col">
            <div className="text-lg font-medium mb-2">Weekly Heatmap</div>
            <div className="grid grid-cols-7 gap-1 h-36 bg-gray-200 rounded overflow-hidden">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex flex-col justify-end">
                  <div className="h-5 bg-[#edf8ff] rounded-t-none rounded-b-none transition-all duration-300 hover:scale-110">
                    <span className="text-xs text-center text-gray-600 leading-none">
                      {Math.min(i + 1, 7)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}