'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Target, Sparkles, Plus, RefreshCw, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  isCompleted: boolean;
}

interface GeneratedTask {
  id?: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimateMinutes: number;
}

interface GoalTaskConverterProps {
  goal: Goal;
  onCreateTasks: (tasks: Omit<GeneratedTask, 'id'>[]) => void;
}

export function GoalTaskConverter({ goal, onCreateTasks }: GoalTaskConverterProps) {
  const queryClient = useQueryClient();
  const [generatedTasks, setGeneratedTasks] = React.useState<GeneratedTask[]>([]);
  const [isGenerating, setIsGenerating] = React.useState(false);

  // AI-powered task generation
  const generateTasksMutation = useMutation({
    mutationFn: async (goal: Goal): Promise<GeneratedTask[]> => {
      const response = await fetch('/api/ai/goal-breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const data = await response.json();
      return data.tasks || [];
    },
    onSuccess: (tasks) => {
      setGeneratedTasks(tasks);
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsGenerating(false);
    },
  });

  const handleGenerateTasks = () => {
    setIsGenerating(true);
    generateTasksMutation.mutate(goal);
  };

  const handleCreateTasks = () => {
    if (generatedTasks.length === 0) return;
    onCreateTasks(generatedTasks);
    setGeneratedTasks([]);
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    toast.success(`Created ${generatedTasks.length} tasks from goal`);
  };

  const progress = goal.targetValue > 0 ? Math.min(100, (goal.currentValue / goal.targetValue) * 100) : 0;

  return (
    <Card className="border-brand-500/20 bg-brand-500/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Target className="w-4 h-4 text-brand-500" />
          Convert Goal to Tasks
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          AI will break down "{goal.title}" into actionable tasks
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {generatedTasks.length === 0 ? (
          <Button
            onClick={handleGenerateTasks}
            disabled={isGenerating || progress >= 100}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Tasks with AI
              </>
            )}
          </Button>
        ) : (
          <>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {generatedTasks.map((task, index) => (
                <div key={index} className="p-3 bg-card rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Input
                        value={task.title}
                        onChange={(e) => setGeneratedTasks(prev => prev.map((t, i) => i === index ? { ...t, title: e.target.value } : t))}
                        className="font-medium text-sm mb-1"
                        placeholder="Task title"
                      />
                      <Textarea
                        value={task.description}
                        onChange={(e) => setGeneratedTasks(prev => prev.map((t, i) => i === index ? { ...t, description: e.target.value } : t))}
                        className="text-xs min-h-[60px]"
                        placeholder="Task description"
                      />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2 text-[10px]",
                        task.priority === 'high' && 'border-red-500 text-red-500',
                        task.priority === 'medium' && 'border-amber-500 text-amber-500',
                        task.priority === 'low' && 'border-blue-500 text-blue-500'
                      )}
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>⏱️ {task.estimateMinutes} min</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateTasks} className="flex-1">
                <CheckSquare className="w-4 h-4 mr-2" />
                Create {generatedTasks.length} Tasks
              </Button>
              <Button variant="outline" onClick={() => setGeneratedTasks([])}>
                Clear
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}