'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, CheckCircle2, GripVertical, Clock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/index';

// Configuration
const WIP_LIMITS = {
  'in_progress': 5, // Maximum tasks in progress
};

const COLUMNS = [
  { id: 'pending', title: 'To Do', color: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: 'completed', title: 'Done', color: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { id: 'cancelled', title: 'Cancelled', color: 'bg-muted/50', borderColor: 'border-muted-300' },
];

type SwimlaneType = 'none' | 'priority' | 'label';

async function fetchTasks() {
  const res = await fetch('/api/tasks?view=all');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch tasks');
  return json.data;
}

function SortableTaskCard({
  task,
  onClick,
  isOverWipLimit,
}: {
  task: Task;
  onClick: (task: Task) => void;
  isOverWipLimit?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(task)}
      className={cn(
        'group relative flex items-start gap-3 rounded-lg border bg-card/60 p-3 transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-primary/20',
        isDragging && 'rotate-1 transition-transform',
        isOverWipLimit && 'ring-2 ring-destructive/30',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3 text-muted-foreground/50" />
        </button>
        <button
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 flex-shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/30" />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={cn(
          'text-sm font-semibold tracking-tight',
          task.status === 'completed' ? 'line-through text-muted-foreground/70' : 'text-foreground/90'
        )}>
          {task.title}
        </h4>
        {task.date && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mt-1">
            <Clock className="w-3 h-3" />
            <span>{new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>

      {task.priority !== 'none' && (
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0 mt-1',
          task.priority === 'high' ? 'bg-red-500' :
          task.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
        )} />
      )}
    </motion.div>
  );
}

export function KanbanBoard({
  onTaskSelect,
}: {
  onTaskSelect: (task: Task) => void;
}) {
  const queryClient = useQueryClient();
  const [swimlaneType, setSwimlaneType] = useState<SwimlaneType>('none');
  const [wipLimitsEnabled, setWipLimitsEnabled] = useState(true);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'kanban'],
    queryFn: fetchTasks,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) => {
      const res = await fetch(`/api/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update task');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as Task['status'];

    const task = tasks.find((t: Task) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    updateMutation.mutate({ id: taskId, status: newStatus });
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t: Task) => t.status === status);
  };

  const getTasksByPriority = (priority: string) => {
    return tasks.filter((t: Task) => t.priority === priority);
  };

  const renderSwimlanes = () => {
    if (swimlaneType === 'priority') {
      const priorities = [
        { id: 'high', title: 'High Priority', icon: '🔴' },
        { id: 'medium', title: 'Medium Priority', icon: '🟡' },
        { id: 'low', title: 'Low Priority', icon: '🟢' },
        { id: 'none', title: 'No Priority', icon: '⚪' },
      ];

      return priorities.map((priority) => (
        <div key={priority.id} className="flex flex-col h-full min-w-[280px]">
          <div className={cn(
            'flex items-center justify-between p-3 rounded-t-lg border-b',
            priority.id === 'high' ? 'bg-red-500/10 border-red-500/30' :
            priority.id === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
            priority.id === 'low' ? 'bg-blue-500/10 border-blue-500/30' :
            'bg-muted/50 border-muted/30'
          )}>
            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <span>{priority.icon}</span>
              {priority.title}
            </h3>
            <Badge variant="secondary" className="text-xs h-5 px-2">
              {getTasksByPriority(priority.id).length}
            </Badge>
          </div>
          <div className="flex-1 bg-muted/20 rounded-b-lg p-3 space-y-2 overflow-y-auto">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.id).filter(
                (task: Task) => task.priority === priority.id
              );
              return (
                <KanbanColumn
                  key={`${column.id}-${priority.id}`}
                  column={column}
                  tasks={columnTasks}
                  onTaskSelect={onTaskSelect}
                />
              );
            })}
          </div>
        </div>
      ));
    }

    // Default: no swimlanes
    return COLUMNS.map((column) => (
      <KanbanColumn
        key={column.id}
        column={column}
        tasks={getTasksByStatus(column.id)}
        onTaskSelect={onTaskSelect}
      />
    ));
  };

  return (
    <div className="h-full">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-4 bg-card/50 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Swimlanes:</span>
            <div className="inline-flex items-center rounded-lg bg-muted/50 p-1">
              <Button
                variant={swimlaneType === 'none' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSwimlaneType('none')}
                className="h-7 px-3 text-xs"
              >
                None
              </Button>
              <Button
                variant={swimlaneType === 'priority' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSwimlaneType('priority')}
                className="h-7 px-3 text-xs"
              >
                Priority
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">WIP Limits:</span>
            <Button
              variant={wipLimitsEnabled ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setWipLimitsEnabled(!wipLimitsEnabled)}
              className="h-7 px-3 text-xs"
            >
              {wipLimitsEnabled ? 'On' : 'Off'}
            </Button>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          {tasks.filter((task: Task) => task.status === 'in_progress').length} in progress
        </Badge>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={tasks.map((task: Task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex gap-4 h-full pb-4 overflow-x-auto">
            {renderSwimlanes()}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Column component for better organization
function KanbanColumn({
  column,
  tasks,
  onTaskSelect,
}: {
  column: { id: string; title: string; color: string; borderColor: string };
  tasks: Task[];
  onTaskSelect: (task: Task) => void;
}) {
  const wipLimit = WIP_LIMITS[column.id as keyof typeof WIP_LIMITS];
  const isOverLimit = wipLimit ? tasks.length > wipLimit : false;

  return (
    <div className="flex flex-col h-full min-w-[280px]">
      <div className={cn(
        'flex items-center justify-between p-3 rounded-t-lg border-b',
        column.borderColor,
        column.color
      )}>
        <h3 className="font-bold text-sm uppercase tracking-wider">{column.title}</h3>
        <div className="flex items-center gap-2">
          {isOverLimit && wipLimit && (
            <Badge variant="destructive" className="text-xs h-5 px-2 animate-pulse">
              WIP Limit: {wipLimit}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs h-5 px-2">
            {tasks.length}
          </Badge>
        </div>
      </div>
      <div className="flex-1 bg-muted/20 rounded-b-lg p-3 space-y-2 overflow-y-auto">
        <AnimatePresence>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground/50">
              <p className="text-sm italic">No tasks</p>
            </div>
          ) : (
            tasks.map((task: Task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={onTaskSelect}
                isOverWipLimit={isOverLimit}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}