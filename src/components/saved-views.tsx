'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SavedView {
  id: string;
  name: string;
  icon: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface SavedViewsProps {
  filters: Record<string, any>;
  onApplyView: (filters: Record<string, any>) => void;
  onSaveCurrentView: (name: string, icon: string) => void;
}

async function fetchSavedViews(): Promise<SavedView[]> {
  const res = await fetch('/api/saved-views');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch saved views');
  return json.data;
}

async function saveView(name: string, icon: string, filters: Record<string, any>): Promise<SavedView> {
  const res = await fetch('/api/saved-views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, icon, filters }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to save view');
  return json.data;
}

async function deleteSavedView(id: string): Promise<void> {
  await fetch(`/api/saved-views?id=${id}`, { method: 'DELETE' });
}

export function SavedViews({ filters, onApplyView, onSaveCurrentView }: SavedViewsProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [saveIcon, setSaveIcon] = React.useState('🔍');

  const { data: savedViews = [], isLoading } = useQuery({
    queryKey: ['saved-views'],
    queryFn: fetchSavedViews,
  });

  const saveMutation = useMutation({
    mutationFn: ({ name, icon, filters }: { name: string; icon: string; filters: Record<string, any> }) =>
      saveView(name, icon, filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] });
      setSaveName('');
      setSaveIcon('🔍');
      setIsSaving(false);
    },
    onError: (err: Error) => {
      setIsSaving(false);
      alert(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSavedView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-views'] });
    },
  });

  const handleSave = () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    saveMutation.mutate({ name: saveName, icon: saveIcon, filters });
    onSaveCurrentView(saveName, saveIcon);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteMutation.mutate(id);
  };

  const hasActiveFilters = Object.values(filters).some(v =>
    v !== '' && v !== null && v !== undefined &&
    (Array.isArray(v) ? v.length > 0 : true)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Saved Views</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSaving(true)}
            className="h-7 px-2 text-xs"
          >
            <Save className="w-3 h-3 mr-1" />
            Save Current
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 p-3 bg-muted/50 rounded-lg"
          >
            <Input
              placeholder="View name..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="h-8 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={!saveName.trim()}>
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsSaving(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-8 bg-muted/30 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : savedViews.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">No saved views yet</p>
      ) : (
        <div className="space-y-1">
          {savedViews.map((view) => {
            const filterCount = Object.keys(view.filters).length;
            return (
              <motion.div
                key={view.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-card hover:bg-muted/50 cursor-pointer group transition-colors"
                onClick={() => onApplyView(view.filters)}
              >
                <span className="text-lg">{view.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{view.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {filterCount} filter{filterCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDelete(view.id, e)}
                >
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}