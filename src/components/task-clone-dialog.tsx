'use client';

import * as React from 'react';
import { Copy, Calendar as CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/index';

interface TaskCloneDialogProps {
  task: Task;
  onClone: (taskId: string, options: CloneOptions) => void;
  lists?: Array<{ id: string; name: string }>;
}

interface CloneOptions {
  resetStatus: boolean;
  resetDate: boolean;
  duplicateSubtasks: boolean;
  newListId?: string;
}

export function TaskCloneDialog({ task, onClone, lists }: TaskCloneDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<CloneOptions>({
    resetStatus: true,
    resetDate: false,
    duplicateSubtasks: true,
  });

  const handleClone = () => {
    onClone(task.id, options);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Clone task">
          <Copy className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone Task</DialogTitle>
          <DialogDescription>
            Create a copy of "{task.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.resetStatus}
                onChange={(e) => setOptions(o => ({ ...o, resetStatus: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Reset status to pending</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.resetDate}
                onChange={(e) => setOptions(o => ({ ...o, resetDate: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Set new date (today)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options.duplicateSubtasks}
                onChange={(e) => setOptions(o => ({ ...o, duplicateSubtasks: e.target.checked }))}
                className="w-4 h-4"
              />
              <span className="text-sm">Duplicate subtasks</span>
            </label>
          </div>

          {lists && lists.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Move to list</label>
              <select
                className="w-full h-10 rounded-md border px-3"
                value={options.newListId || ''}
                onChange={(e) => setOptions(o => ({ ...o, newListId: e.target.value || undefined }))}
              >
                <option value="">Keep in same list</option>
                {lists.map(list => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleClone} className="flex-1">
            Clone Task
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}