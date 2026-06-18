'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Unlink, AlertCircle, CheckCircle2, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  task?: {
    id: string;
    title: string;
    status: string;
  };
}

interface TaskDependenciesProps {
  taskId: string;
  className?: string;
}

export function TaskDependencies({ taskId, className }: TaskDependenciesProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [newDependencyId, setNewDependencyId] = React.useState('');
  const [isGraphOpen, setIsGraphOpen] = React.useState(false);

  const { data: dependencies = [], isLoading, refetch } = useQuery({
    queryKey: ['dependencies', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/dependencies?taskId=${taskId}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const { data: allTasks = [] } = useQuery({
    queryKey: ['tasks', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?view=all');
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const handleAddDependency = async () => {
    if (!newDependencyId) return;
    try {
      const res = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, dependsOnId: newDependencyId }),
      });
      if (res.ok) {
        setNewDependencyId('');
        setIsAdding(false);
        refetch();
      }
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      const res = await fetch(`/api/dependencies?id=${depId}`, { method: 'DELETE' });
      if (res.ok) refetch();
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  const isBlocked = dependencies.some((dep: TaskDependency) => {
    const depTask = allTasks.find((t: any) => t.id === dep.dependsOnId);
    return depTask && depTask.status !== 'completed' && depTask.status !== 'cancelled';
  });

  const availableTasks = allTasks.filter((t: any) =>
    t.id !== taskId &&
    !dependencies.some((d: TaskDependency) => d.dependsOnId === t.id)
  );

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Task Dependencies</h4>
          {isBlocked && (
            <Badge variant="destructive" className="text-[10px]">
              Blocked
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGraphOpen(true)}
            className="h-6 px-2"
            title="View dependency graph"
          >
            <GitBranch className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-6 px-2"
          >
            <Link className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {isAdding && (
        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mb-3">
          <select
            value={newDependencyId}
            onChange={(e) => setNewDependencyId(e.target.value)}
            className="flex-1 h-8 text-sm rounded border bg-background"
          >
            <option value="">Select a task...</option>
            {availableTasks.map((task: any) => (
              <option key={task.id} value={task.id}>
                {task.title}
              </option>
            ))}
          </select>
          <Button size="sm" onClick={handleAddDependency} disabled={!newDependencyId}>
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            <Unlink className="w-3 h-3" />
          </Button>
        </div>
      )}

      {dependencies.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">No dependencies configured</p>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep: TaskDependency & { task?: any }) => (
            <div
              key={dep.id}
              className={cn(
                'flex items-center justify-between p-2 bg-muted/30 rounded-lg text-sm',
                dep.task?.status === 'completed' && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-2">
                {dep.task?.status === 'completed' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                )}
                <span>{dep.task?.title || 'Unknown task'}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDependency(dep.id)}
                className="h-6 w-6 p-0"
              >
                <Unlink className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Dependency Graph Dialog */}
      <Dialog open={isGraphOpen} onOpenChange={setIsGraphOpen}>
        <DialogContent className="max-w-3xl max-h-[70vh]">
          <DialogHeader>
            <DialogTitle>Dependency Graph</DialogTitle>
          </DialogHeader>
          <DependencyGraph
            taskId={taskId}
            dependencies={dependencies}
            allTasks={allTasks}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}

interface DependencyGraphProps {
  taskId: string;
  dependencies: any[];
  allTasks: any[];
}

function DependencyGraph({ taskId, dependencies, allTasks }: DependencyGraphProps) {
  const currentTask = allTasks.find(t => t.id === taskId);
  const blockedBy = dependencies.filter(d => d.taskId === taskId);
  const blocking = dependencies.filter(d => d.dependsOnId === taskId);

  return (
    <div className="p-4">
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center">
          {/* Tasks that must be completed first */}
          {blockedBy.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {blockedBy.map((dep: any) => {
                const task = allTasks.find(t => t.id === dep.dependsOnId);
                return task ? (
                  <div
                    key={dep.id}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-center",
                      task.status === 'completed'
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-amber-500/10 border-amber-500/30"
                    )}
                  >
                    <p className="font-medium text-sm line-clamp-1">{task.title}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      task.status === 'completed' ? "text-emerald-600" : "text-amber-600"
                    )}>
                      {task.status === 'completed' ? 'Completed' : 'Pending'}
                    </p>
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Current task */}
          <div className="mb-6">
            <div className="px-6 py-3 rounded-xl bg-primary/10 border-2 border-primary/30 text-center">
              <p className="font-bold text-lg">{currentTask?.title || 'Current Task'}</p>
              <p className="text-xs text-muted-foreground mt-1">Current Task</p>
            </div>
          </div>

          {/* Tasks that depend on this task */}
          {blocking.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3">
              {blocking.map((dep: any) => {
                const task = allTasks.find(t => t.id === dep.taskId);
                return task ? (
                  <div
                    key={dep.id}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-center",
                      task.status === 'completed'
                        ? "bg-emerald-500/10 border-emerald-500/30"
                        : "bg-blue-500/10 border-blue-500/30"
                    )}
                  >
                    <p className="font-medium text-sm line-clamp-1">{task.title}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      task.status === 'completed' ? "text-emerald-600" : "text-blue-600"
                    )}>
                      {task.status === 'completed' ? 'Completed' : 'Waiting'}
                    </p>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}