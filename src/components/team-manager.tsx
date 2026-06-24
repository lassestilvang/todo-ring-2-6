'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Shield, UserMinus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: string;
}

interface TeamManagerProps {
  teamId?: string;
  readOnly?: boolean;
}

async function fetchTeam(teamId: string): Promise<Team> {
  const res = await fetch(`/api/teams/${teamId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch team');
  return json.data;
}

async function createTeam(name: string, description: string): Promise<Team> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create team');
  return json.data;
}

async function addTeamMember(teamId: string, email: string, role: 'viewer' | 'editor' | 'admin'): Promise<TeamMember> {
  const res = await fetch(`/api/teams/${teamId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to add member');
  return json.data;
}

async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  await fetch(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' });
}

export function TeamManager({ teamId, readOnly = false }: TeamManagerProps) {
  const queryClient = useQueryClient();
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamId ? fetchTeam(teamId) : Promise.reject(),
    enabled: !!teamId,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) => createTeam(name, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, email, role }: { teamId: string; email: string; role: 'viewer' | 'editor' | 'admin' }) =>
      addTeamMember(teamId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setNewMemberEmail('');
      toast.success('Member added successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMember(teamId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      toast.success('Member removed');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    createMutation.mutate({ name: newTeamName, description: newTeamDesc });
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !teamId) return;
    addMemberMutation.mutate({ teamId, email: newMemberEmail, role: newMemberRole });
  };

  const handleRemoveMember = (userId: string) => {
    if (!teamId) return;
    removeMemberMutation.mutate({ teamId, userId });
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      editor: 'bg-blue-100 text-blue-800 border-blue-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return `border ${variants[role as keyof typeof variants] || variants.viewer}`;
  };

  if (!teamId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Create a team to start collaborating with others.
          </p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="team-desc">Description (optional)</Label>
              <Input
                id="team-desc"
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="What is this team for?"
              />
            </div>
            <Button onClick={handleCreateTeam} disabled={!newTeamName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Team
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {team?.name || 'Team'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {team?.description || 'No description'}
          </p>

          {!readOnly && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Add Member</h4>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer - Can see tasks</SelectItem>
                      <SelectItem value="editor">Editor - Can edit tasks</SelectItem>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddMember} disabled={!newMemberEmail.trim()}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add to Team
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members ({team?.members?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {team?.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleBadge(member.role)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {member.role}
                  </Badge>
                  {!readOnly && member.role !== 'admin' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}