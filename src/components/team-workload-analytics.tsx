'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, BarChart3, AlertCircle, TrendingUp, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'editor' | 'viewer';
  tasks: {
    id: string;
    title: string;
    status: string;
    estimateMinutes: number;
    dueDate?: string;
  }[];
  capacity: number; // hours per day
}

interface TeamWorkloadData {
  team: {
    id: string;
    name: string;
    description: string;
  };
  members: TeamMember[];
  workload: {
    memberId: string;
    date: string;
    allocatedHours: number;
    capacityHours: number;
    utilization: number;
  }[];
}

interface TeamWorkloadAnalyticsProps {
  teamId: string;
  className?: string;
}

export function TeamWorkloadAnalytics({ teamId, className }: TeamWorkloadAnalyticsProps) {
  const { data: workloadData, isLoading } = useQuery({
    queryKey: ['team-workload', teamId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/team-workload?teamId=${teamId}`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
  });

  if (isLoading) {
    return (
      <div className={cn("grid gap-4", className)}>
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted/30 rounded mb-2" />
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted/20 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!workloadData) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No team data available</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold">{workloadData.team.name}</h2>
        <p className="text-muted-foreground">{workloadData.team.description}</p>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workloadData.members.map((member) => {
          const memberWorkload = workloadData.workload.filter(w => w.memberId === member.id);
          const totalAllocated = memberWorkload.reduce((sum, w) => sum + w.allocatedHours, 0);
          const avgUtilization = memberWorkload.length > 0
            ? memberWorkload.reduce((sum, w) => sum + w.utilization, 0) / memberWorkload.length
            : 0;
          const overloaded = avgUtilization > 85;
          const underloaded = avgUtilization < 30;

          return (
            <Card key={member.id} className={cn(
              "relative",
              overloaded && "border-red-500/50 bg-red-500/5",
              underloaded && "border-blue-500/50 bg-blue-500/5"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{member.name}</span>
                  <Badge variant={overloaded ? "destructive" : underloaded ? "secondary" : "default"}>
                    {overloaded ? "Overloaded" : underloaded ? "Underloaded" : "Balanced"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role: {member.role}</span>
                  <span className="text-sm font-medium">{member.capacity}h/day</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Utilization</span>
                    <span className={cn(
                      "font-medium",
                      overloaded && "text-red-600",
                      underloaded && "text-blue-600"
                    )}>
                      {Math.round(avgUtilization)}%
                    </span>
                  </div>
                  <Progress value={avgUtilization} className="h-2" />
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tasks ({member.tasks.length})</p>
                  <div className="max-h-32 overflow-y-auto">
                    {member.tasks.slice(0, 5).map(task => (
                      <div key={task.id} className="text-xs py-1 border-b last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="truncate">{task.title}</span>
                          <Badge variant="outline" className="text-[10px] ml-2">
                            {task.estimateMinutes}m
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-[10px]",
                            task.status === 'completed' && "text-emerald-600",
                            task.status === 'in_progress' && "text-amber-600"
                          )}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground">
                              Due: {format(new Date(task.dueDate), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {member.tasks.length > 5 && (
                      <p className="text-[10px] text-muted-foreground">
                        +{member.tasks.length - 5} more tasks
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Workload Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Workload Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end gap-2">
            {workloadData.members.map((member) => {
              const memberWorkload = workloadData.workload.filter(w => w.memberId === member.id);
              const maxHours = Math.max(...memberWorkload.map(w => w.allocatedHours), 1);

              return (
                <div key={member.id} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex items-end gap-1 h-48">
                    {memberWorkload.map((w, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-6 rounded-t transition-all hover:opacity-80",
                          w.utilization > 85 ? "bg-red-500" :
                          w.utilization < 30 ? "bg-blue-500" : "bg-emerald-500"
                        )}
                        style={{ height: `${(w.allocatedHours / maxHours) * 100}%` }}
                        title={`${format(new Date(w.date), 'MMM d')}: ${w.allocatedHours}h`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground truncate max-w-[60px]">
                    {member.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}