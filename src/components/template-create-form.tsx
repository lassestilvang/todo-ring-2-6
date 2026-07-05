'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { extractTemplateVariables, BUILTIN_TEMPLATE_VARIABLES, type TemplateVariable } from '@/lib/validations';

const templateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default('📋'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  priority: z.enum(['high', 'medium', 'low', 'none']).default('none'),
  estimateHours: z.number().min(0).default(0),
  estimateMinutes: z.number().min(0).max(59).default(0),
  isAllDay: z.boolean().default(false),
  recurringType: z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']).default('none'),
  category: z.string().default('general'),
  isPublic: z.boolean().default(false),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateCreateFormProps {
  onClose: () => void;
}

export function TemplateCreateForm({ onClose }: TemplateCreateFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      icon: '📋',
      title: '',
      description: '',
      priority: 'none',
      estimateHours: 0,
      estimateMinutes: 0,
      isAllDay: false,
      recurringType: 'none',
      category: 'general',
      isPublic: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: TemplateFormValues) => {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create template');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      onClose();
    },
  });

  const onSubmit = (values: TemplateFormValues) => {
    createMutation.mutate(values);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Template Name</Label>
        <Input
          id="name"
          placeholder="e.g., Project Setup"
          {...form.register('name')}
          aria-required="true"
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Task Title</Label>
        <Input
          id="title"
          placeholder="e.g., Set up project structure"
          {...form.register('title')}
          aria-required="true"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
        {extractTemplateVariables(form.getValues('title')).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <span className="text-xs text-muted-foreground">Variables:</span>
            {extractTemplateVariables(form.getValues('title')).map(v => {
              const varInfo = BUILTIN_TEMPLATE_VARIABLES.find(bv => bv.key === v);
              return (
                <Badge key={v} variant="secondary" className="text-xs">
                  {`{{${v}}}`}
                </Badge>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Template description..."
          {...form.register('description')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select onValueChange={(v) => form.setValue('priority', v as any)} value={form.getValues('priority')}>
            <SelectTrigger id="priority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="e.g., Work"
            {...form.register('category')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estimateHours">Estimate</Label>
          <div className="flex gap-2">
            <Input
              id="estimateHours"
              type="number"
              min="0"
              max="999"
              {...form.register('estimateHours', { valueAsNumber: true })}
            />
            <span className="self-center text-sm text-muted-foreground">hrs</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimateMinutes">Minutes</Label>
          <Input
            id="estimateMinutes"
            type="number"
            min="0"
            max="59"
            {...form.register('estimateMinutes', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isAllDay"
          checked={form.getValues('isAllDay')}
          onCheckedChange={(v) => form.setValue('isAllDay', v)}
        />
        <Label htmlFor="isAllDay" className="text-sm">All day event</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={form.getValues('isPublic')}
          onCheckedChange={(v) => form.setValue('isPublic', v)}
        />
        <Label htmlFor="isPublic" className="text-sm">Publish to Marketplace</Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Template'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}