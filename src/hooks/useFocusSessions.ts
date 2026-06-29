import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/types/index';

interface FocusSession {
  id: string;
  taskId: string;
  task?: Task;
  duration: number;
  startedAt: string;
  completedAt?: string;
  status: 'active' | 'completed' | 'cancelled';
}

async function fetchSessions(userId: string, limit = 10): Promise<FocusSession[]> {
  const res = await fetch(`/api/focus-sessions?userId=${userId}&limit=${limit}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch sessions');
  return json.data;
}

async function startSession(data: { taskId?: string; duration: number; userId: string }) {
  const res = await fetch('/api/focus-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to start session');
  return json.data as FocusSession;
}

async function completeSession(id: string) {
  const res = await fetch('/api/focus-sessions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to complete session');
  return json.data;
}

export function useFocusSessions(userId?: string) {
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['focus-sessions', userId],
    queryFn: () => userId ? fetchSessions(userId) : [],
    enabled: !!userId,
    refetchInterval: 60000,
  });

  const startMutation = useMutation({
    mutationFn: startSession,
    onSettled: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: ['focus-sessions', userId] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: completeSession,
    onSettled: () => {
      if (userId) queryClient.invalidateQueries({ queryKey: ['focus-sessions', userId] });
    },
  });

  const startFocusSession = (duration: number, taskId?: string) => {
    if (!userId) return Promise.reject(new Error('User ID required'));
    return startMutation.mutateAsync({ duration, taskId, userId });
  };

  const completeFocusSession = (id: string) => {
    return completeMutation.mutateAsync(id);
  };

  return {
    sessions: sessions || [],
    isLoading,
    startSession: startFocusSession,
    completeSession: completeFocusSession,
    isStarting: startMutation.isPending,
    isCompleting: completeMutation.isPending,
  };
}