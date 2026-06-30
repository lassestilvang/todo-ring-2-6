/**
 * Task Batches Component
 * Group tasks into batches (projects/orders)
 */

'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit, Save, X, FolderTree } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskBatch {
  id: string;
  name: string;
  description: string;
  color: string;
  task_count: number;
}

interface TaskBatchesProps {
  tasks: any[];
  onTaskSelect?: (taskId: string) => void;
}

async function fetchBatches(): Promise<TaskBatch[]> {
  const res = await fetch('/api/task-batches');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch batches');
  return json.data;
}

export function TaskBatches({ tasks, onTaskSelect }: TaskBatchesProps) {
  const queryClient = useQueryClient();
  const [editingBatch, setEditingBatch] = useState<TaskBatch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['task-batches'],
    queryFn: fetchBatches,
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; color: string }) => {
      const res = await fetch('/api/task-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create batch');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-batches'] });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setColor('#3b82f6');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: TaskBatch & { taskIds?: string[] }) => {
      const res = await fetch(`/api/task-batches?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update batch');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-batches'] });
      setEditingBatch(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/task-batches?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete batch');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-batches'] });
    },
  });

  const handleSubmit = () => {
    if (editingBatch) {
      updateMutation.mutate({ ...editingBatch, name, description, color });
    } else {
      createMutation.mutate({ name, description, color });
    }
  };

  const handleEdit = (batch: TaskBatch) => {
    setEditingBatch(batch);
    setName(batch.name);
    setDescription(batch.description);
    setColor(batch.color);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading batches...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Task Batches</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          <Plus size={16} />
          New Batch
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FolderTree size={48} className="mx-auto mb-2" />
          <p>No batches yet. Create your first batch to organize tasks.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) => (
            <div
              key={batch.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              style={{ borderLeft: `4px solid ${batch.color}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{batch.name}</h3>
                <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(batch)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(batch.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              </div>
              {batch.description && (
                <p className="text-sm text-muted-foreground mb-2">{batch.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{batch.task_count} tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isModalOpen || editingBatch) && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingBatch ? 'Edit Batch' : 'Create Batch'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Batch name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Batch description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full mt-1 h-10 border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingBatch(null);
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {editingBatch ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}