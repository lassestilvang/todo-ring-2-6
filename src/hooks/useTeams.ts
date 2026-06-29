import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Team } from '@/types/index';

async function fetchTeams(userId?: string) {
  const res = await fetch(`/api/teams${userId ? `?userId=${userId}` : ''}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch teams');
  return json.data as Team[];
}

async function createTeam(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create team');
  return json.data as Team;
}

export function useTeams(userId?: string) {
  const queryClient = useQueryClient();

  const { data: teams, isLoading, error } = useQuery({
    queryKey: ['teams', userId],
    queryFn: () => fetchTeams(userId),
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: createTeam,
    onMutate: () => {
      queryClient.cancelQueries({ queryKey: ['teams', userId] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teams', userId] });
    },
  });

  const createTeamWrapper = async (data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    return createMutation.mutateAsync(data);
  };

  return {
    teams: teams || [],
    isLoading,
    error,
    createTeam: createTeamWrapper,
    isCreating: createMutation.isPending,
  };
}