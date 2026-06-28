'use client';

import * as React from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Trash2, CheckSquare, Square, Copy, Move, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface BulkActionsProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
}

async function fetchLists() {
  const res = await fetch('/api/lists');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch lists');
  return json.data;
}

export function BulkActions({ selectedIds, onClearSelection }: BulkActionsProps) {
  const queryClient = useQueryClient();
  const [movePopoverOpen, setMovePopoverOpen] = React.useState(false);
  const [selectedListId, setSelectedListId] = React.useState<string>('');

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, action, data }: { ids: string[]; action: 'complete' | 'pending' | 'delete' | 'move' | 'priority'; data?: any }) => {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, data }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update tasks');
      return json;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      const count = result.updated || variables.ids.length;
      toast.success(`${count} tasks updated`);
      onClearSelection();
      setMovePopoverOpen(false);
    },
    onError: (err: Error) => { toast.error(err.message); },
  });

  const handleBulkAction = (action: 'complete' | 'pending' | 'delete') => {
    if (selectedIds.size === 0) return;

    if (action === 'delete' && !confirm(`Delete ${selectedIds.size} tasks?`)) {
      return;
    }

    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), action });
  };

  const handlePriorityChange = (priority: 'high' | 'medium' | 'low') => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), action: 'priority', data: { priority } });
  };

  if (selectedIds.size === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Copy className="w-3.5 h-3.5 mr-2" />
            Actions ({selectedIds.size})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleBulkAction('complete')}>
            <CheckSquare className="w-4 h-4 mr-2" />
            Mark as Complete
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleBulkAction('pending')}>
            <Square className="w-4 h-4 mr-2" />
            Mark as Pending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePriorityChange('high')}>
            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
            Set Priority: High
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Popover open={movePopoverOpen} onOpenChange={setMovePopoverOpen}>
            <PopoverTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Move className="w-4 h-4 mr-2" />
                Move to List...
              </DropdownMenuItem>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Select a list</p>
                {lists.map((list: any) => (
                  <button
                    key={list.id}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                    onClick={() => {
                      setSelectedListId(list.id);
                      setMovePopoverOpen(false);
                      setTimeout(() => bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), action: 'move', data: { listId: list.id } }), 100);
                    }}
                  >
                    <span>{list.emoji}</span>
                    <span>{list.name}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={onClearSelection}>
        Cancel
      </Button>
    </div>
  );
}