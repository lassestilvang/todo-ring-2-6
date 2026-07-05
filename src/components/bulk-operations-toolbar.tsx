'use client';

import * as React from 'react';
import { CheckSquare, Square, Trash2, Edit, Move, Copy, Calendar as CalendarIcon, Tag, Flag, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/index';

interface BulkOperationsToolbarProps {
  selectedTasks: Task[];
  onClearSelection: () => void;
  onBulkDelete: (ids: string[]) => void;
  onBulkUpdate: (ids: string[], updates: Partial<Task>) => void;
  lists: Array<{ id: string; name: string; color: string }>;
  labels: Array<{ id: string; name: string; color: string }>;
}

export function BulkOperationsToolbar({
  selectedTasks,
  onClearSelection,
  onBulkDelete,
  onBulkUpdate,
  lists,
  labels,
}: BulkOperationsToolbarProps) {
  const [showDateDialog, setShowDateDialog] = React.useState(false);
  const [showLabelDialog, setShowLabelDialog] = React.useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = React.useState(false);

  if (selectedTasks.length === 0) return null;

  const selectedIds = selectedTasks.map(t => t.id);

  const handleBulkStatusChange = (status: Task['status']) => {
    onBulkUpdate(selectedIds, { status });
    onClearSelection();
  };

  const handleBulkPriorityChange = (priority: Task['priority']) => {
    onBulkUpdate(selectedIds, { priority });
    onClearSelection();
  };

  const handleBulkDelete = () => {
    onBulkDelete(selectedIds);
    onClearSelection();
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border rounded-full shadow-lg px-4 py-2 flex items-center gap-2 z-40">
        <div className="flex items-center gap-2 pr-2 border-r">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{selectedTasks.length} selected</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleBulkStatusChange('completed')}
          title="Mark complete"
          className="h-8 px-2"
        >
          Complete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPriorityDialog(true)}
          title="Set priority"
          className="h-8 px-2"
        >
          <Flag className="w-3 h-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDateDialog(true)}
          title="Set due date"
          className="h-8 px-2"
        >
          <CalendarIcon className="w-3 h-3" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowLabelDialog(true)}
          title="Add labels"
          className="h-8 px-2"
        >
          <Tag className="w-3 h-3" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="mb-2">
            <DropdownMenuItem onClick={() => handleBulkStatusChange('in_progress')}>
              Mark In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkStatusChange('pending')}>
              Mark Pending
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 px-0"
        >
          ×
        </Button>
      </div>

      {/* Move to List Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Due Date</DialogTitle>
            <DialogDescription>
              Apply a due date to all selected tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <input
              type="date"
              className="w-full h-10 rounded-md border px-3"
              onChange={(e) => {
                if (e.target.value) {
                  onBulkUpdate(selectedIds, { deadline: e.target.value });
                  onClearSelection();
                }
              }}
              defaultValue={new Date().toISOString().split('T')[0] ?? ''}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Labels Dialog */}
      <Dialog open={showLabelDialog} onOpenChange={setShowLabelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Labels</DialogTitle>
            <DialogDescription>
              Add labels to all selected tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {labels.map(label => (
                <button
                  key={label.id}
                  className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted text-left"
                  onClick={() => {
                    // Add label to all selected tasks
                    onBulkUpdate(selectedIds, {
                      labels: selectedTasks.flatMap(t => t.labels || []).concat(label.id)
                    });
                    onClearSelection();
                  }}
                >
                  <span>{label.icon || '🏷'}</span>
                  <span className="text-sm">{label.name}</span>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Priority Dialog */}
      <Dialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Priority</DialogTitle>
            <DialogDescription>
              Apply priority to all selected tasks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {(['high', 'medium', 'low', 'none'] as const).map(priority => (
              <button
                key={priority}
                className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-muted text-left capitalize"
                onClick={() => {
                  handleBulkPriorityChange(priority);
                  setShowPriorityDialog(false);
                }}
              >
                <Flag className="w-4 h-4" />
                {priority} Priority
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}