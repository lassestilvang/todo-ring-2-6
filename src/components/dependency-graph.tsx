'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Link, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Task, TaskDependency } from '@/types/index';

interface DependencyGraphProps {
  tasks: Task[];
  dependencies: TaskDependency[];
  onTaskSelect?: (task: Task) => void;
  onAddDependency?: (taskId: string, dependsOnId: string) => void;
  onRemoveDependency?: (taskId: string, dependsOnId: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

export function DependencyGraph({
  tasks,
  dependencies,
  onTaskSelect,
  onAddDependency,
  onRemoveDependency,
}: DependencyGraphProps) {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [draggedNode, setDraggedNode] = React.useState<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Calculate node positions using a simple layout algorithm
  const positions = React.useMemo(() => {
    const pos: Record<string, NodePosition> = {};
    const levels: Record<string, number> = {};

    // Calculate levels (depth in dependency tree)
    const calculateLevel = (taskId: string, visited: Set<string>): number => {
      if (levels[taskId] !== undefined) return levels[taskId];
      if (visited.has(taskId)) return 0; // Circular dependency

      visited.add(taskId);
      const deps = dependencies.filter(d => d.taskId === taskId);
      if (deps.length === 0) {
        levels[taskId] = 0;
        return 0;
      }

      const maxDepLevel = Math.max(...deps.map(d => calculateLevel(d.dependsOnId, new Set(visited))));
      levels[taskId] = maxDepLevel + 1;
      return levels[taskId];
    };

    // Assign levels
    tasks.forEach(t => calculateLevel(t.id, new Set()));

    // Position nodes
    const levelGroups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([taskId, level]) => {
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(taskId);
    });

    Object.entries(levelGroups).forEach(([level, taskIds]) => {
      const y = parseInt(level) * 100;
      taskIds.forEach((taskId, index) => {
        pos[taskId] = { x: index * 250 + 100, y };
      });
    });

    return pos;
  }, [tasks, dependencies]);

  // Detect circular dependencies
  const detectCircularDependencies = (): Set<string> => {
    const circular = new Set<string>();
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (taskId: string): boolean => {
      visited.add(taskId);
      recStack.add(taskId);

      const deps = dependencies.filter(d => d.taskId === taskId);
      for (const dep of deps) {
        if (!visited.has(dep.dependsOnId)) {
          if (dfs(dep.dependsOnId)) {
            circular.add(taskId);
            circular.add(dep.dependsOnId);
            return true;
          }
        } else if (recStack.has(dep.dependsOnId)) {
          circular.add(taskId);
          circular.add(dep.dependsOnId);
          return true;
        }
      }

      recStack.delete(taskId);
      return false;
    };

    tasks.forEach(t => {
      if (!visited.has(t.id)) {
        dfs(t.id);
      }
    });

    return circular;
  };

  const circularDeps = detectCircularDependencies();

  // Get blocked tasks (tasks with incomplete dependencies)
  const getBlockedTasks = (): Set<string> => {
    const blocked = new Set<string>();
    const completed = new Set(tasks.filter(t => t.status === 'completed').map(t => t.id));

    dependencies.forEach(dep => {
      if (!completed.has(dep.dependsOnId)) {
        blocked.add(dep.taskId);
      }
    });

    return blocked;
  };

  const blockedTasks = getBlockedTasks();

  // Get task status color
  const getStatusColor = (task: Task) => {
    if (circularDeps.has(task.id)) return 'border-red-500 bg-red-500/20';
    if (blockedTasks.has(task.id)) return 'border-amber-500 bg-amber-500/20';
    if (task.status === 'completed') return 'border-emerald-500 bg-emerald-500/20';
    if (task.status === 'cancelled') return 'border-gray-500 bg-gray-500/20';
    return 'border-blue-500 bg-blue-500/10';
  };

  // Render connection line between tasks
  const renderConnection = (dep: TaskDependency) => {
    const from = positions[dep.taskId];
    const to = positions[dep.dependsOnId];

    if (!from || !to) return null;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    const isBlocked = blockedTasks.has(dep.taskId) && !circularDeps.has(dep.taskId);
    const isCircular = circularDeps.has(dep.taskId) || circularDeps.has(dep.dependsOnId);

    return (
      <line
        key={dep.id}
        x1={from.x + 100}
        y1={from.y + 50}
        x2={to.x + 100}
        y2={to.y + 50}
        stroke={isCircular ? '#ef4444' : isBlocked ? '#f59e0b' : '#3b82f6'}
        strokeWidth={isCircular ? 2 : 1.5}
        strokeDasharray={isBlocked ? '5,5' : 'none'}
        className={cn(
          "transition-all duration-300",
          isCircular && "animate-pulse"
        )}
      />
    );
  };

  // Handle drag and drop for creating dependencies
  const handleDragEnd = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (draggedNode && draggedNode !== taskId) {
      onAddDependency?.(taskId, draggedNode);
    }
    setDraggedNode(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link className="w-5 h-5 text-brand-500" />
          Task Dependencies
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/30 border border-red-500" />
            <span>Circular</span>
          </div>
        </div>
      </div>

      {circularDeps.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-lg bg-red-500/10 border border-red-500/20"
        >
          <p className="text-sm text-red-600 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Circular dependencies detected! These tasks cannot be completed.
          </p>
        </motion.div>
      )}

      <TooltipProvider>
        <div
          ref={containerRef}
          className="relative overflow-x-auto pb-4"
          style={{ minHeight: '400px' }}
        >
          <svg
            width="100%"
            height={Math.max(400, Object.keys(positions).length * 100 + 50)}
            className="absolute top-0 left-0"
          >
            {/* Render connections */}
            {dependencies.map(renderConnection)}

            {/* Render nodes */}
            {tasks.map((task) => {
              const pos = positions[task.id];
              if (!pos) return null;

              return (
                <g key={task.id}>
                  <foreignObject
                    x={pos.x}
                    y={pos.y}
                    width={120}
                    height={60}
                    className="cursor-move"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedNode(task.id);
                    }}
                    onDragEnd={(e) => handleDragEnd(e, task.id)}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.g
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={() => onTaskSelect?.(task)}
                          className={cn(
                            "rounded-lg border-2 p-2 bg-card/80 backdrop-blur cursor-pointer transition-all duration-200 hover:shadow-lg",
                            getStatusColor(task),
                            blockedTasks.has(task.id) && "pointer-events-none opacity-70"
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-1">{task.title}</p>
                              <div className="flex items-center gap-1 mt-1">
                                {task.priority !== 'none' && (
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-[10px] h-4 px-1",
                                      task.priority === 'high' && "border-red-500 text-red-500",
                                      task.priority === 'medium' && "border-amber-500 text-amber-500",
                                      task.priority === 'low' && "border-blue-500 text-blue-500"
                                    )}
                                  >
                                    {task.priority}
                                  </Badge>
                                )}
                                {task.status === 'completed' && (
                                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                                )}
                                {circularDeps.has(task.id) && (
                                  <AlertCircle className="w-3 h-3 text-red-500" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.g>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="w-48">
                        <div className="space-y-1">
                          <p className="font-medium">{task.title}</p>
                          <p className="text-xs text-muted-foreground">{task.description || 'No description'}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span>Status: {task.status}</span>
                            <span>Priority: {task.priority}</span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                      </foreignObject>
                  </g>
              );
            })}
          </svg>
        </div>
      </TooltipProvider>

      <div className="text-xs text-muted-foreground/60">
        <p>💡 Drag tasks to create dependencies. Blocked tasks have incomplete prerequisites.</p>
      </div>
    </div>
  );
}