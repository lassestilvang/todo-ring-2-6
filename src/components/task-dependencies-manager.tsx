'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Task, TaskDependency } from '@/types/index';

interface TaskDependenciesManagerProps {
  task: Task;
  onAddDependency?: (taskId: string, dependsOnId: string) => void;
  onRemoveDependency?: (taskId: string, dependsOnId: string) => void;
  onTaskSelect?: (task: Task) => void;
}

export function TaskDependenciesManager({
  task,
  onAddDependency,
  onRemoveDependency,
  onTaskSelect,
}: TaskDependenciesManagerProps) {
  const [dependencies, setDependencies] = useState<TaskDependency[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDepId, setSelectedDepId] = useState<string>('');

  // Fetch dependencies and available tasks
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dependencies
        const depRes = await fetch(`/api/dependencies?taskId=${task.id}`);
        const depJson = await depRes.json();
        if (depJson.success) {
          setDependencies(depJson.data.dependencies || []);
        }

        // Fetch available tasks to block
        const taskRes = await fetch('/api/tasks?view=all');
        const taskJson = await taskRes.json();
        if (taskJson.success) {
          setAvailableTasks(taskJson.data.filter((t: Task) => t.id !== task.id));
        }
      } catch (error) {
        console.error('Failed to fetch dependencies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [task.id]);

  const handleAddDependency = async () => {
    if (!selectedDepId) return;

    try {
      const res = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, dependsOnId: selectedDepId }),
      });

      const json = await res.json();
      if (json.success) {
        setDependencies([...dependencies, json.data]);
        setSelectedDepId('');
      }
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  };

  const handleRemoveDependency = async (dependsOnId: string) => {
    try {
      const res = await fetch(`/api/dependencies?taskId=${task.id}&dependsOnId=${dependsOnId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDependencies(dependencies.filter(d => d.dependsOnId !== dependsOnId));
      }
    } catch (error) {
      console.error('Failed to remove dependency:', error);
    }
  };

  const getBlockedTasks = (): Task[] => {
    const blockedIds = dependencies.map(d => d.dependsOnId);
    return availableTasks.filter(t => blockedIds.includes(t.id));
  };

  const getBlockingTasks = (): Task[] => {
    // Tasks that this task blocks (dependents)
    const blockingIds = dependencies.map(d => d.dependsOnId);
    return availableTasks.filter(t => blockingIds.includes(t.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Link className="w-4 h-4 text-brand-500" />
          Dependencies
        </h4>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="w-3 h-3 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Dependency</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This task will be blocked until the selected task is completed.
              </p>
              <Select value={selectedDepId} onValueChange={setSelectedDepId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task to block this one" />
                </SelectTrigger>
                <SelectContent>
                  {availableTasks
                    .filter(t => !dependencies.some(d => d.dependsOnId === t.id))
                    .map(task => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddDependency} disabled={!selectedDepId}>
                Add Dependency
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading dependencies...</div>
      ) : dependencies.length === 0 ? (
        <div className="text-sm text-muted-foreground/60">
          No dependencies. Add one to block this task until another is completed.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">BLOCKED BY:</div>
          {dependencies.map(dep => {
            const blockedTask = availableTasks.find(t => t.id === dep.dependsOnId);
            return (
              <div
                key={dep.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  {blockedTask?.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span
                    className="text-sm cursor-pointer hover:underline"
                    onClick={() => blockedTask && onTaskSelect?.(blockedTask)}
                  >
                    {blockedTask?.title || 'Unknown task'}
                  </span>
                  {blockedTask && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        blockedTask.priority === 'high' && "border-red-500 text-red-500",
                        blockedTask.priority === 'medium' && "border-amber-500 text-amber-500",
                        blockedTask.priority === 'low' && "border-blue-500 text-blue-500"
                      )}
                    >
                      {blockedTask.priority}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveDependency(dep.dependsOnId)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}