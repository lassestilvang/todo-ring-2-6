'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Share2, Grid3x3, List, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SavedView {
  id: string;
  name: string;
  icon: string;
  filters: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isShared?: boolean;
}

interface SavedViewsProps {
  filters: Record<string, any>;
  onApplyView: (filters: Record<string, any>) => void;
  onSaveCurrentView: (name: string, icon: string) => void;
}

// Predefined icons for views
const VIEW_ICONS = ['🔍', '📋', '📊', '✅', '⏳', '⭐', '📅', '🎯', '🚀', '💡', '📈', '📉', '🔄', '🔗'];

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

async function shareView(id: string): Promise<string> {
  const res = await fetch(`/api/saved-views/${id}/share`, { method: 'POST' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to share view');
  return json.data.shareUrl;
}

export function SavedViews({ filters, onApplyView, onSaveCurrentView }: SavedViewsProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [saveIcon, setSaveIcon] = React.useState('🔍');
  const [viewLayout, setViewLayout] = React.useState<'grid' | 'list'>('grid');

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

  const handleShare = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const shareUrl = await shareView(id);
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to create share link');
    }
  };

  const hasActiveFilters = Object.values(filters).some(v =>
    v !== '' && v !== null && v !== undefined &&
    (Array.isArray(v) ? v.length > 0 : true)
  );

  // Keyboard shortcut to save view
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        if (hasActiveFilters) {
          setIsSaving(true);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasActiveFilters]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Saved Views</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-muted/50 p-1">
            <Button
              variant={viewLayout === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewLayout('grid')}
              className="h-6 w-6 p-0"
              title="Grid view"
            >
              <Grid3x3 className="w-3 h-3" />
            </Button>
            <Button
              variant={viewLayout === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewLayout('list')}
              className="h-6 w-6 p-0"
              title="List view"
            >
              <List className="w-3 h-3" />
            </Button>
          </div>
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
      </div>

      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-3 bg-muted/50 rounded-lg"
          >
            <div className="space-y-2">
              <Label className="text-xs">View Name</Label>
              <Input
                placeholder="View name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Icon</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-8 w-full justify-start gap-2">
                    <span>{saveIcon}</span>
                    <span className="text-muted-foreground">Choose icon</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {VIEW_ICONS.map(icon => (
                      <button
                        key={icon}
                        className="text-2xl hover:scale-110 transition-transform p-1 rounded hover:bg-muted/50"
                        onClick={() => setSaveIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
        <div className={cn("gap-2", viewLayout === 'grid' ? 'grid grid-cols-2 gap-2' : 'space-y-2')}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-muted/30 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      ) : savedViews.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">No saved views yet</p>
      ) : (
        <div className={cn(
          viewLayout === 'grid'
            ? 'grid grid-cols-2 gap-2'
            : 'space-y-2'
        )}>
          {savedViews.map((view) => {
            const filterCount = Object.keys(view.filters).length;
            return viewLayout === 'grid' ? (
              <motion.div
                key={view.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 rounded-lg bg-card border hover:bg-muted/50 cursor-pointer group transition-all duration-200"
                onClick={() => onApplyView(view.filters)}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl mb-2">{view.icon}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleShare(view.id, e)}
                      title="Share this view"
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDelete(view.id, e)}
                      title="Delete this view"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <p className="font-medium text-sm truncate">{view.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filterCount} filter{filterCount !== 1 ? 's' : ''}
                </p>
              </motion.div>
            ) : (
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
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleShare(view.id, e)}
                    title="Share this view"
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDelete(view.id, e)}
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}