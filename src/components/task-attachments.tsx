'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface TaskAttachmentsProps {
  taskId: string;
}

interface Attachment {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

function getFileTypeIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation')) return '📈';
  if (fileType.includes('zip') || fileType.includes('archive')) return '📁';
  return '📎';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function fetchAttachments(taskId: string): Promise<Attachment[]> {
  const res = await fetch(`/api/attachments?taskId=${taskId}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch attachments');
  return json.data;
}

export function TaskAttachments({ taskId }: TaskAttachmentsProps) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = React.useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', taskId],
    queryFn: () => fetchAttachments(taskId),
    enabled: !!taskId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('taskId', taskId);

      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to upload file');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      toast.success('File uploaded');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/attachments?id=${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments', taskId] });
      toast.success('Attachment removed');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    uploadMutation.mutate(file);
    // Reset input
    e.target.value = '';
    setUploading(false);
  };

  if (isLoading) {
    return (
      <section className="mt-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Paperclip className="w-4 h-4" />
          <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Attachments</h4>
        </div>
        <div className="h-20 rounded-lg bg-muted/30 animate-pulse" />
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Paperclip className="w-4 h-4" />
        <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Attachments ({attachments.length})</h4>
      </div>

      <div className="space-y-3">
        {/* Upload area */}
        <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-4 text-center">
          <Input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id="file-upload-attachments"
          />
          <label htmlFor="file-upload-attachments" className="cursor-pointer">
            <Upload className="w-6 h-6 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-muted-foreground/80">
              {uploading ? 'Uploading...' : 'Click to upload file'}
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">Max 10MB • PDF, Images, Docs</p>
          </label>
        </div>

        {/* Attachments list */}
        <div className="space-y-2">
          {attachments.map((att) => {
            const icon = getFileTypeIcon(att.fileType);
            return (
              <div key={att.id} className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <span className="text-2xl">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.filename}</p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatFileSize(att.fileSize)} • {new Date(att.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(att.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  title="Remove attachment"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}