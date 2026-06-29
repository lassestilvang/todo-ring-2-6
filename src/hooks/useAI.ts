import { useQuery, useMutation } from '@tanstack/react-query';
import type { Task } from '@/types/index';

interface PrioritizedTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  score: number;
  reason: string;
}

interface Conflict {
  type: 'circular' | 'blocked' | 'schedule';
  tasks: string[];
  message: string;
}

async function prioritizeTasks(): Promise<PrioritizedTask[]> {
  const res = await fetch('/api/ai/prioritize', { method: 'POST' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to prioritize');
  return json.data;
}

async function detectConflicts(): Promise<Conflict[]> {
  const res = await fetch('/api/ai/conflicts', { method: 'POST' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to detect conflicts');
  return json.data;
}

export function useAI() {
  const { data: prioritizedTasks, isLoading: isLoadingPrioritization, refetch: refetchPrioritization } = useQuery({
    queryKey: ['ai-prioritization'],
    queryFn: prioritizeTasks,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: conflicts, isLoading: isLoadingConflicts, refetch: refetchConflicts } = useQuery({
    queryKey: ['ai-conflicts'],
    queryFn: detectConflicts,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    prioritizedTasks: prioritizedTasks || [],
    conflicts: conflicts || [],
    isLoadingPrioritization,
    isLoadingConflicts,
    reprioritize: refetchPrioritization,
    recheckConflicts: refetchConflicts,
  };
}