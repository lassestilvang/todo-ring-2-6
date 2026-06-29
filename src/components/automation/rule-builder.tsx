'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Switch,
} from '@/components/ui';
import { CheckCircle2, Trash2, Plus, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConditionType =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_deleted'
  | 'date_reached'
  | 'priority_changed'
  | 'list_changed'
  | 'time_of_day';

export type ActionType =
  | 'create_task'
  | 'update_task'
  | 'send_notification'
  | 'create_subtask'
  | 'add_label'
  | 'set_priority'
  | 'move_to_list'
  | 'send_email';

export interface RuleCondition {
  type: ConditionType;
  field?: string;
  value?: string | number | boolean;
  operator?: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
}

export interface RuleAction {
  type: ActionType;
  taskData?: Partial<{
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    date: string;
  }>;
  notificationMessage?: string;
  labelId?: string;
  priority?: 'high' | 'medium' | 'low';
  listId?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  action: RuleAction;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RuleBuilderProps {
  onSaveRule?: (rule: AutomationRule) => void;
  onCancel?: () => void;
  initialRule?: AutomationRule;
}

export function AutomationRuleBuilder({
  onSaveRule,
  onCancel,
  initialRule
}: RuleBuilderProps) {
  const [name, setName] = React.useState(initialRule?.name ?? '');
  const [description, setDescription] = React.useState(initialRule?.description ?? '');
  const [conditionType, setConditionType] = React.useState<ConditionType>(initialRule?.condition?.type ?? 'task_created');
  const [actionType, setActionType] = React.useState<ActionType>(initialRule?.action?.type ?? 'create_task');
  const [conditionField, setConditionField] = React.useState<string>(initialRule?.condition?.field ?? '');
  const [conditionOperator, setConditionOperator] = React.useState<string>(initialRule?.condition?.operator ?? 'equals');
  const [conditionValue, setConditionValue] = React.useState<string>(initialRule?.condition?.value?.toString() ?? '');
  const [actionTaskTitle, setActionTaskTitle] = React.useState<string>(initialRule?.action?.taskData?.title ?? '');
  const [actionTaskDescription, setActionTaskDescription] = React.useState<string>(initialRule?.action?.taskData?.description ?? '');
  const [actionTaskPriority, setActionTaskPriority] = React.useState<'high' | 'medium' | 'low'>(initialRule?.action?.taskData?.priority ?? 'medium');
  const [actionTaskDate, setActionTaskDate] = React.useState<string>(initialRule?.action?.taskData?.date ?? '');
  const [notificationMessage, setNotificationMessage] = React.useState<string>(initialRule?.action?.notificationMessage ?? '');
  const [selectedLabelId, setSelectedLabelId] = React.useState<string>(initialRule?.action?.labelId ?? '');
  const [selectedPriority, setSelectedPriority] = React.useState<'high' | 'medium' | 'low'>(initialRule?.action?.priority ?? 'medium');
  const [selectedListId, setSelectedListId] = React.useState<string>(initialRule?.action?.listId ?? '');
  const [enabled, setEnabled] = React.useState<boolean>(initialRule?.enabled ?? true);
  const [isSaving, setIsSaving] = React.useState(false);

  const conditionOptions: { label: string; value: ConditionType }[] = [
    { label: 'Task Created', value: 'task_created' },
    { label: 'Task Updated', value: 'task_updated' },
    { label: 'Task Completed', value: 'task_completed' },
    { label: 'Task Deleted', value: 'task_deleted' },
    { label: 'Date Reached', value: 'date_reached' },
    { label: 'Priority Changed', value: 'priority_changed' },
    { label: 'List Changed', value: 'list_changed' },
    { label: 'Time of Day', value: 'time_of_day' },
  ];

  const actionOptions: { label: string; value: ActionType }[] = [
    { label: 'Create Task', value: 'create_task' },
    { label: 'Update Task', value: 'update_task' },
    { label: 'Send Notification', value: 'send_notification' },
    { label: 'Create Subtask', value: 'create_subtask' },
    { label: 'Add Label', value: 'add_label' },
    { label: 'Set Priority', value: 'set_priority' },
    { label: 'Move to List', value: 'move_to_list' },
    { label: 'Send Email', value: 'send_email' },
  ];

  const operatorOptions = [
    { label: 'Equals', value: 'equals' },
    { label: 'Not Equals', value: 'not_equals' },
    { label: 'Greater Than', value: 'greater_than' },
    { label: 'Less Than', value: 'less_than' },
    { label: 'Contains', value: 'contains' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Rule name is required');
      return;
    }

    setIsSaving(true);
    try {
      const rule: AutomationRule = {
        id: initialRule?.id ?? Math.random().toString(36).substr(2, 9),
        name,
        description,
        condition: {
          type: conditionType,
          field: conditionField || undefined,
          value: conditionValue ? (isNaN(Number(conditionValue)) ? conditionValue : Number(conditionValue)) : undefined,
          operator: conditionOperator || undefined,
        },
        action: {
          type: actionType,
          taskData: {
            title: actionTaskTitle,
            description: actionTaskDescription,
            priority: actionTaskPriority,
            date: actionTaskDate,
          },
          notificationMessage: notificationMessage || undefined,
          labelId: selectedLabelId || undefined,
          priority: selectedPriority || undefined,
          listId: selectedListId || undefined,
        },
        enabled,
        createdAt: initialRule?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In a real app, this would save to API
      // await fetch('/api/automation/rules', { method: 'POST', body: JSON.stringify(rule) });

      onSaveRule?.(rule);
    } catch (err) {
      alert('Failed to save rule');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="space-y-6">
      <div className="bg-card/50 rounded-xl p-6 border border-border/50">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-brand-500" />
          Automation Rule Builder
        </h2>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground/80">Rule Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Send email when high priority task is completed"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground/80">Description (Optional)</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this automation does"
              className="h-20"
            />
          </div>

          {/* Condition Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">When this happens</h3>
              <button type="button" onClick={() => setConditionType('task_created')} className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground/80">Condition Type</label>
                <Select
                  value={conditionType}
                  onValueChange={setConditionType}
                  className="w-full"
                >
                  {conditionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground/80">Field (Optional)</label>
                <Input
                  value={conditionField}
                  onChange={(e) => setConditionField(e.target.value)}
                  placeholder="e.g., priority, title"
                  className="h-10"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground/80">Operator</label>
                <Select
                  value={conditionOperator}
                  onValueChange={setConditionOperator}
                  className="w-full"
                >
                  {operatorOptions.map(op => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground/80">Value</label>
                <Input
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="Enter value..."
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Action Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Then do this</h3>
              <button type="button" onClick={() => setActionType('create_task')} className="text-xs text-muted-foreground/50 hover:text-muted-foreground">
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground/80">Action Type</label>
                <Select
                  value={actionType}
                  onValueChange={setActionType}
                  className="w-full"
                >
                  {actionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Dynamic action fields based on action type */}
              {actionType === 'create_task' && (
                <>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground/80">Task Title</label>
                    <Input
                      value={actionTaskTitle}
                      onChange={(e) => setActionTaskTitle(e.target.value)}
                      placeholder="New task title"
                      className="h-10"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground/80">Task Description</label>
                    <Textarea
                      value={actionTaskDescription}
                      onChange={(e) => setActionTaskDescription(e.target.value)}
                      placeholder="Task description"
                      className="h-16"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground/80">Priority</label>
                    <Select
                      value={actionTaskPriority}
                      onValueChange={setActionTaskPriority}
                      className="w-full"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground/80">Due Date (Optional)</label>
                    <Input
                      type="date"
                      value={actionTaskDate}
                      onChange={(e) => setActionTaskDate(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </>
              )}

              {actionType === 'send_notification' && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-muted-foreground/80">Notification Message</label>
                  <Input
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    placeholder="Message to send"
                    className="h-10"
                  />
                </div>
              )}

              {actionType === 'add_label' && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground/80">Label ID</label>
                  <Input
                    value={selectedLabelId}
                    onChange={(e) => setSelectedLabelId(e.target.value)}
                    placeholder="Label ID to add"
                    className="h-10"
                  />
                </div>
              )}

              {actionType === 'set_priority' && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground/80">Priority to Set</label>
                  <Select
                    value={selectedPriority}
                    onValueChange={setSelectedPriority}
                    className="w-full"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </Select>
                </div>
              )}

              {actionType === 'move_to_list' && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground/80">List ID to Move To</label>
                  <Input
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    placeholder="Target list ID"
                    className="h-10"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Toggle and Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50">
            <div className="flex items-center gap-3">
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="h-4 w-6"
              />
              <span className="text-sm font-medium">{enabled ? 'Enabled' : 'Disabled'}</span>
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full md:w-auto px-6 py-3"
            >
              {isSaving ? 'Saving...' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </div>

      {/* Example rules */}
      <div className="bg-card/50 rounded-xl p-6 border border-border/50">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-500" />
          Example Rules
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Zap className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">Task Completed Notification</h3>
              <p className="text-sm text-muted-foreground/60">
                When: Task Completed → Then: Send Notification ("Great job! You completed a task!")
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Zap className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">High Priority Follow-up</h3>
              <p className="text-sm text-muted-foreground/60">
                When: Task Created with High Priority → Then: Create Subtask ("Review requirements")
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Zap className="w-4 h-4 text-brand-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-medium">Daily Review Reminder</h3>
              <p className="text-sm text-muted-foreground/60">
                When: Time of Day is 18:00 → Then: Create Task ("Review today's progress")
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}