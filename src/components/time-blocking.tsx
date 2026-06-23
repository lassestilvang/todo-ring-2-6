'use client';

import * as React from 'react';
import { format, startOfDay, endOfDay, eachHourOfInterval } from 'date-fns';
import { Clock, Plus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/index';

interface TimeBlock {
  id: string;
  taskId: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date: string; // YYYY-MM-DD
}

interface TimeBlockingProps {
  date: string;
  tasks: Task[];
  onTaskMove?: (taskId: string, newDate: string, newStartTime: string) => void;
}

export function TimeBlocking({ date, tasks, onTaskMove }: TimeBlockingProps) {
  const [blocks, setBlocks] = React.useState<TimeBlock[]>([]);
  const [isAddingBlock, setIsAddingBlock] = React.useState(false);
  const [newBlock, setNewBlock] = React.useState({ startTime: '', endTime: '', taskId: '' });

  // Generate hourly slots
  const hours = React.useMemo(() => {
    const dayStart = startOfDay(new Date());
    const dayEnd = endOfDay(new Date());
    return eachHourOfInterval({ start: dayStart, end: dayEnd });
  }, []);

  // Get tasks for this date
  const dateTasks = React.useMemo(() => {
    return tasks.filter(t => t.date === date);
  }, [tasks, date]);

  // Add a new time block
  const handleAddBlock = () => {
    if (!newBlock.startTime || !newBlock.endTime || !newBlock.taskId) return;

    const newBlockItem: TimeBlock = {
      id: crypto.randomUUID(),
      taskId: newBlock.taskId,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      date,
    };

    setBlocks([...blocks, newBlockItem]);
    setNewBlock({ startTime: '', endTime: '', taskId: '' });
    setIsAddingBlock(false);
  };

  // Remove a block
  const handleRemoveBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  // Get task by ID
  const getTask = (taskId: string) => {
    return dateTasks.find(t => t.id === taskId);
  };

  // Render time slot
  const renderTimeSlot = (hour: Date, index: number) => {
    const timeStr = format(hour, 'HH:mm');
    const isCurrentHour = format(new Date(), 'HH') === format(hour, 'HH');

    return (
      <div
        key={hour.toString()}
        className={cn(
          "relative border-b border-border/30 h-16 group transition-colors",
          isCurrentHour && "bg-blue-500/10 border-blue-500/30"
        )}
      >
        <div className="absolute -top-3 left-0 w-full text-center">
          <span className="text-[10px] text-muted-foreground/60 bg-card px-1">
            {timeStr}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-500" />
          Time Blocking - {format(new Date(date), 'MMMM d, yyyy')}
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsAddingBlock(true)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Block
        </Button>
      </div>

      {/* Time slots */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {hours.map((hour, index) => renderTimeSlot(hour, index))}
        </div>
      </div>

      {/* Scheduled tasks */}
      {dateTasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Scheduled Tasks</h4>
          <div className="space-y-2">
            {dateTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.estimateHours}h {task.estimateMinutes}m estimated
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {task.date ? format(new Date(task.date), 'HH:mm') : 'All day'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add block dialog */}
      {isAddingBlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Add Time Block</h4>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Task</label>
                <select
                  className="w-full p-2 rounded border bg-background"
                  value={newBlock.taskId}
                  onChange={(e) => setNewBlock({ ...newBlock, taskId: e.target.value })}
                >
                  <option value="">Select a task</option>
                  {dateTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Time</label>
                  <input
                    type="time"
                    className="w-full p-2 rounded border bg-background"
                    value={newBlock.startTime}
                    onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Time</label>
                  <input
                    type="time"
                    className="w-full p-2 rounded border bg-background"
                    value={newBlock.endTime}
                    onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddingBlock(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddBlock}>
                Add Block
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}