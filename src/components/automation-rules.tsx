'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  triggerType: string;
  triggerValue: string | null;
  actionType: string;
  actionValue: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

async function fetchRules(): Promise<AutomationRule[]> {
  const res = await fetch('/api/automation/rules?userId=current-user');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch rules');
  return json.data;
}

const TRIGGER_OPTIONS = [
  { value: 'task_completed', label: 'When task is completed' },
  { value: 'task_created', label: 'When task is created' },
  { value: 'task_updated', label: 'When task is updated' },
  { value: 'due_date_passed', label: 'When due date passes' },
  { value: 'status_changed', label: 'When status changes' },
  { value: 'priority_changed', label: 'When priority changes' },
];

const ACTION_OPTIONS = [
  { value: 'create_task', label: 'Create a task' },
  { value: 'update_task', label: 'Update a task' },
  { value: 'set_priority', label: 'Set priority' },
  { value: 'add_label', label: 'Add a label' },
  { value: 'assign_user', label: 'Assign to user' },
  { value: 'send_notification', label: 'Send notification' },
];

export function AutomationRules() {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: fetchRules,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/automation/rules/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: string; isEnabled: boolean }) => {
      await fetch(`/api/automation/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggle = (id: string, isEnabled: boolean) => {
    toggleMutation.mutate({ id, isEnabled });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Automation Rules</CardTitle>
            <CardDescription>Automatically perform actions based on triggers</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Automation Rule</DialogTitle>
                <DialogDescription>
                  Define when something happens and what action to take
                </DialogDescription>
              </DialogHeader>
              <RuleForm onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted/50 rounded-lg mb-2" />
              </div>
            ))}
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No automation rules yet. Create your first rule to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TRIGGER_OPTIONS.find(t => t.value === rule.triggerType)?.label} →{' '}
                    {ACTION_OPTIONS.find(a => a.value === rule.actionType)?.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={rule.isEnabled}
                    onCheckedChange={(v: boolean) => handleToggle(rule.id, v)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RuleForm({ onClose }: { onClose: () => void }) {
  const [triggerType, setTriggerType] = React.useState('');
  const [actionType, setActionType] = React.useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create rule');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      userId: 'current-user',
      name: formData.get('name'),
      triggerType,
      triggerValue: formData.get('triggerValue'),
      actionType,
      actionValue: formData.get('actionValue'),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Rule Name</Label>
        <Input id="name" name="name" placeholder="e.g., Create follow-up task" required />
      </div>

      <div className="space-y-2">
        <Label>Trigger</Label>
        <Select value={triggerType} onValueChange={setTriggerType}>
          <SelectTrigger>
            <SelectValue placeholder="When this happens..." />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Action</Label>
        <Select value={actionType} onValueChange={setActionType}>
          <SelectTrigger>
            <SelectValue placeholder="Then do this..." />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="actionValue">Action Details</Label>
        <Textarea
          id="actionValue"
          name="actionValue"
          placeholder='{"title": "Follow-up task", "priority": "medium"}'
          className="font-mono text-sm"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Rule'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}