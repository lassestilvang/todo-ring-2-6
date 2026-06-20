'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Target, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Goal } from '@/types/index';

// Fetch goals
async function fetchGoals(period?: string): Promise<Goal[]> {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  const res = await fetch(`/api/goals?${params.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch goals');
  return json.data;
}

// Create goal
async function createGoal(data: Omit<Goal, 'id' | 'userId' | 'currentValue' | 'isCompleted' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
  const res = await fetch('/api/goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create goal');
  return json.data;
}

// Delete goal
async function deleteGoal(id: string): Promise<void> {
  const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to delete goal');
}

// Goal form component
function GoalForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [targetValue, setTargetValue] = React.useState(10);
  const [unit, setUnit] = React.useState('tasks');
  const [period, setPeriod] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [category, setCategory] = React.useState('general');
  const [color, setColor] = React.useState('#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    let endDate = startDate;

    if (period === 'daily') {
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (period === 'weekly') {
      endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (period === 'monthly') {
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    } else if (period === 'yearly') {
      endDate = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
    }

    onSubmit({
      title,
      description,
      targetValue,
      unit,
      period,
      category,
      color,
      startDate,
      endDate,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setTargetValue(10);
    setUnit('tasks');
    setPeriod('weekly');
    setCategory('general');
    setColor('#3b82f6');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            type="number"
            placeholder="Target"
            value={targetValue}
            onChange={(e) => setTargetValue(parseInt(e.target.value) || 1)}
            min={1}
          />
        </div>
        <div>
          <Input
            placeholder="Unit (tasks, hours, etc.)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>
      </div>
      <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
        <SelectTrigger>
          <SelectValue placeholder="Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-20"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="work">Work</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full">
        Create Goal
      </Button>
    </form>
  );
}

// Goal card component
function GoalCard({ goal }: { goal: Goal }) {
  const percentage = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  const isCompleted = goal.isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className={cn("relative overflow-hidden", isCompleted && "opacity-60")}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span>{goal.title}</span>
            <Badge variant={isCompleted ? "default" : "secondary"}>
              {isCompleted ? "Completed" : `${percentage}%`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {goal.period}
              </span>
            </div>
            <Progress value={percentage} className="h-2" />
            {goal.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">{goal.description}</p>
            )}
          </div>
        </CardContent>
        <div
          className="absolute top-0 right-0 w-1 h-full"
          style={{ backgroundColor: goal.color }}
        />
      </Card>
    </motion.div>
  );
}

export function GoalTracker() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [activePeriod, setActivePeriod] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');

  // Fetch goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', activePeriod],
    queryFn: () => fetchGoals(activePeriod),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsDialogOpen(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleCreate = (data: any) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const periodLabels = {
    daily: 'Today',
    weekly: 'This Week',
    monthly: 'This Month',
    yearly: 'This Year',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Goals</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Goal</DialogTitle>
            </DialogHeader>
            <GoalForm onSubmit={handleCreate} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
          <Button
            key={period}
            size="sm"
            variant={activePeriod === period ? 'default' : 'ghost'}
            onClick={() => setActivePeriod(period)}
          >
            {periodLabels[period]}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No goals yet. Create your first goal to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}