'use client';

import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, CheckSquare, Move, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';

// TODO: Implement move and label functionality
// These functions are placeholders for future implementation
function handleMovePlaceholder() {
  console.log('Move functionality coming soon');
}
function handleAddLabelPlaceholder() {
  console.log('Add label functionality coming soon');
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkTaskOperationsProps {
  selectedIds: Set<string>;
  onClearSelection: () => void;
}

async function bulkDelete(ids: string[]): Promise<void> {
  await fetch(`/api/tasks/bulk`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
}

async function bulkUpdate(ids: string[], updates: { status?: string; priority?: string }): Promise<void> {
  await fetch(`/api/tasks/bulk`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, updates }),
  });
}

export function BulkTaskOperations({ selectedIds, onClearSelection }: BulkTaskOperationsProps) {
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = React.useState(false);

  const deleteMutation = useMutation({
    mutationFn: bulkDelete,
    onMutate: () => setIsProcessing(true),
    onSettled: () => {
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClearSelection();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { status?: string; priority?: string }) =>
      bulkUpdate(Array.from(selectedIds), updates),
    onMutate: () => setIsProcessing(true),
    onSettled: () => {
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleDelete = () => {
    if (window.confirm(`Delete ${selectedIds.size} tasks?`)) {
      deleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const handleComplete = () => {
    updateMutation.mutate({ status: 'completed' });
    onClearSelection();
  };

  const handleMove = () => {
    // Would open list selection dialog
    console.log('Move tasks:', Array.from(selectedIds));
  };

  const handleAddLabel = () => {
    // Would open label selection dialog
    console.log('Add label to tasks:', Array.from(selectedIds));
  };

  if (selectedIds.size === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
      <span className="text-sm font-medium">{selectedIds.size} selected</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleComplete}
          disabled={isProcessing}
        >
          <CheckSquare className="w-4 h-4 mr-1" />
          Complete
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleMove}
          disabled={isProcessing}
        >
          <Move className="w-4 h-4 mr-1" />
          Move
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddLabel}
          disabled={isProcessing}
        >
          <Tag className="w-4 h-4 mr-1" />
          Label
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isProcessing}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}