'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Share2, Shield, UserPlus, Settings, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TeamWorkspaceProps {
  userId: string;
  userName: string;
}

interface Workspace {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  members: WorkspaceMember[];
  tasks: string[];
  createdAt: string;
}

interface WorkspaceMember {
  userId: string;
  userName: string;
  role: 'viewer' | 'editor' | 'admin';
  joinedAt: string;
}

// Fetch workspaces
async function fetchWorkspaces(): Promise<Workspace[]> {
  // In production, this would fetch from the API
  return [
    {
      id: 'ws-1',
      name: 'Product Development',
      description: 'Main product development workspace',
      createdBy: 'current-user',
      members: [
        { userId: 'user-1', userName: 'Alex Johnson', role: 'admin', joinedAt: '2024-01-15' },
        { userId: 'user-2', userName: 'Sarah Chen', role: 'editor', joinedAt: '2024-02-01' },
        { userId: 'user-3', userName: 'Mike Smith', role: 'viewer', joinedAt: '2024-02-15' },
      ],
      tasks: ['task-1', 'task-2', 'task-3'],
      createdAt: '2024-01-15T00:00:00Z',
    },
  ];
}

// Create workspace mutation
async function createWorkspace(data: { name: string; description: string }): Promise<Workspace> {
  // In production, this would call the API
  return {
    id: crypto.randomUUID(),
    ...data,
    createdBy: 'current-user',
    members: [{ userId: 'current-user', userName: 'Current User', role: 'admin', joinedAt: new Date().toISOString() }],
    tasks: [],
    createdAt: new Date().toISOString(),
  };
}

// Invite member component
function InviteMemberDialog({ workspace }: { workspace: Workspace }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<'viewer' | 'editor' | 'admin'>('viewer');

  const handleInvite = () => {
    // In production, this would call the API
    console.log('Inviting', email, 'as', role, 'to', workspace.name);
    setIsOpen(false);
    setEmail('');
    setRole('viewer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="w-4 h-4 mr-1" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member to {workspace.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email Address</label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer - Can see tasks only</SelectItem>
                <SelectItem value="editor">Editor - Can edit tasks</SelectItem>
                <SelectItem value="admin">Admin - Full access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite}>
              Send Invitation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Workspace card component
function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Card className="group relative overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{workspace.name}</CardTitle>
          <Badge variant="outline">
            <Shield className="w-3 h-3 mr-1" />
            {workspace.members.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground/60 line-clamp-2">
          {workspace.description}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Members */}
          <div>
            <p className="text-[10px] text-muted-foreground/60 uppercase mb-1">Members</p>
            <div className="flex -space-x-2">
              {workspace.members.slice(0, 3).map((member) => (
                <div
                  key={member.userId}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold border-2 border-card"
                  title={member.userName}
                >
                  {member.userName.charAt(0)}
                </div>
              ))}
              {workspace.members.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-card">
                  +{workspace.members.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
            <InviteMemberDialog workspace={workspace} />
            <Button size="sm" variant="ghost" className="flex-1">
              <ExternalLink className="w-3 h-3 mr-1" />
              Open
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create workspace dialog
function CreateWorkspaceDialog({ onCreate }: { onCreate: (data: any) => void }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({ name, description });
    setIsOpen(false);
    setName('');
    setDescription('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Share2 className="w-4 h-4 mr-2" />
          New Workspace
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Workspace</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Workspace Name</label>
            <Input
              placeholder="e.g., Marketing Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Input
              placeholder="What's this workspace for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TeamWorkspace({ userId, userName }: TeamWorkspaceProps) {
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);

  React.useEffect(() => {
    fetchWorkspaces().then(setWorkspaces);
  }, []);

  const handleCreate = (data: { name: string; description: string }) => {
    createWorkspace(data).then((ws) => setWorkspaces([...workspaces, ws]));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-500" />
          Team Workspaces
        </h3>
        <CreateWorkspaceDialog onCreate={handleCreate} />
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Share2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="mb-2">No workspaces yet</p>
          <p className="text-sm">Create a workspace to collaborate with your team</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </div>
  );
}