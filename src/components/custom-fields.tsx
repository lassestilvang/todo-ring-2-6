'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface CustomField {
  id: string;
  taskId: string;
  fieldKey: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  fieldValue: string;
  label: string;
}

interface CustomFieldsProps {
  taskId: string;
  className?: string;
}

export function CustomFields({ taskId, className }: CustomFieldsProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = React.useState(false);
  const [newField, setNewField] = React.useState({
    fieldKey: '',
    fieldType: 'text' as const,
    label: '',
    fieldValue: '',
  });

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ['custom-fields', taskId],
    queryFn: async () => {
      const res = await fetch(`/api/custom-fields?taskId=${taskId}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/custom-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...data }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', taskId] });
      setIsAdding(false);
      setNewField({ fieldKey: '', fieldType: 'text', label: '', fieldValue: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, fieldValue }: { id: string; fieldValue: string }) => {
      const res = await fetch('/api/custom-fields', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fieldValue }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', taskId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/custom-fields?id=${id}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-fields', taskId] });
    },
  });

  const handleAdd = () => {
    if (!newField.fieldKey || !newField.label) return;
    createMutation.mutate(newField);
  };

  const renderFieldInput = (field: CustomField) => {
    const commonProps = {
      className: 'w-full',
      defaultValue: field.fieldValue,
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        updateMutation.mutate({ id: field.id, fieldValue: e.target.value });
      },
    };

    switch (field.fieldType) {
      case 'textarea':
        return <Textarea {...commonProps} rows={3} />;
      case 'number':
        return <Input {...commonProps} type="number" />;
      case 'date':
        return <Input {...commonProps} type="date" />;
      case 'checkbox':
        return (
          <input
            type="checkbox"
            defaultChecked={field.fieldValue === 'true'}
            onChange={(e) => updateMutation.mutate({ id: field.id, fieldValue: e.target.checked.toString() })}
            className="w-4 h-4"
          />
        );
      case 'select':
        return <Select onValueChange={(v) => updateMutation.mutate({ id: field.id, fieldValue: v })}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent />
        </Select>;
      default:
        return <Input {...commonProps} />;
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading fields...</div>;
  }

  return (
    <section className={cn(className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Edit3 className="w-4 h-4" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Custom Fields</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="h-6 w-6 p-0"
          title="Add field"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {isAdding && (
        <div className="flex items-end gap-2 p-3 bg-muted/30 rounded-lg mb-3">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Field name"
              value={newField.label}
              onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              className="h-7 text-sm"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Key (e.g., priority)"
                value={newField.fieldKey}
                onChange={(e) => setNewField({ ...newField, fieldKey: e.target.value })}
                className="h-7 text-sm flex-1"
              />
              <Select value={newField.fieldType} onValueChange={(v) => setNewField({ ...newField, fieldType: v as any })}>
                <SelectTrigger className="h-7 w-[100px]">
                  <SelectValue />
                </SelectTrigger>
              </Select>
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!newField.fieldKey || !newField.label}>
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground/60">No custom fields yet</p>
      ) : (
        <div className="space-y-3">
          {fields.map((field: CustomField) => (
            <div key={field.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(field.id)}
                  className="h-5 w-5 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              {renderFieldInput(field)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
