'use client';

import * as React from 'react';
import { Share2, Trash2, Shield, Eye, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
// Note: getCurrentUser moved to server-auth.ts to avoid client-side bundling issues
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
  listId?: string;
  type?: 'task' | 'list';
}

interface Share {
  id: string;
  user_id: string;
  user_name: string;
  role: 'viewer' | 'editor' | 'admin';
}

async function fetchShares(entityType: 'task' | 'list', entityId: string): Promise<Share[]> {
  const res = await fetch(`/api/sharing?${entityType}Id=${entityId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch shares');
  return json.data;
}

export function ShareDialog({ open, onOpenChange, taskId, listId, type = 'task' }: ShareDialogProps) {
  const [email, setEmail] = React.useState('');
  const [isSharing, setIsSharing] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<'viewer' | 'editor' | 'admin'>('viewer');
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const entityId = taskId || listId;
  const entityType = type;

  const { data: shares = [] } = useQuery({
    queryKey: ['shares', entityType, entityId],
    queryFn: () => fetchShares(entityType, entityId || ''),
    enabled: !!entityId && open,
  });

  const shareMutation = useMutation({
    mutationFn: async (data: { userId: string; userName: string; role: 'viewer' | 'editor' | 'admin' }) => {
      const res = await fetch('/api/sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [entityType === 'task' ? 'taskId' : 'listId']: entityId,
          ...data,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to share');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', entityType, entityId] });
      toast.success('Shared successfully');
      setEmail('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      await fetch(`/api/sharing?id=${shareId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares', entityType, entityId] });
      toast.success('Share removed');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleShare = async () => {
    if (!email.trim() || !user) return;

    setIsSharing(true);
    try {
      await shareMutation.mutateAsync({
        userId: email.trim(),
        userName: user.name,
        role: selectedRole,
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemove = (shareId: string) => {
    removeMutation.mutate(shareId);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'editor': return Edit;
      default: return Eye;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'editor': return 'Editor';
      default: return 'Viewer';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Share2 className="w-5 h-5 text-brand-500" />
            Share {type === 'task' ? 'Task' : 'List'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60 font-medium">
            Invite others to collaborate on this {type === 'task' ? 'task' : 'list'}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email or User ID</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email or user ID"
              className="w-full"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
              <div className="flex gap-1">
                {(['viewer', 'editor', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                      selectedRole === role
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    {getRoleLabel(role)}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleShare}
              disabled={isSharing || !email.trim()}
              className="h-9"
            >
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>

          {shares.length > 0 && (
            <div className="pt-2">
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Current Shares</label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {shares.map((share) => {
                  const Icon = getRoleIcon(share.role);
                  return (
                    <div key={share.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3 text-muted-foreground" />
                        <div>
                          <span className="text-sm font-medium">{share.user_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({getRoleLabel(share.role)})</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(share.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}