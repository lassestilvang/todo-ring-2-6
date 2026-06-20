'use client';

import * as React from 'react';
import { Settings, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface KeyboardShortcut {
  id: string;
  name: string;
  key: string;
  modifier: string;
  action: string;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { id: '1', name: 'New Task', key: 'n', modifier: 'meta', action: 'new_task' },
  { id: '2', name: 'Search', key: 'k', modifier: 'meta', action: 'search' },
  { id: '3', name: 'Toggle View', key: 'v', modifier: 'meta', action: 'toggle_view' },
];

export function KeyboardShortcutCustomizer() {
  const [shortcuts, setShortcuts] = React.useState<KeyboardShortcut[]>(() => {
    const saved = localStorage.getItem('keyboard-shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });

  const saveShortcuts = (updated: KeyboardShortcut[]) => {
    setShortcuts(updated);
    localStorage.setItem('keyboard-shortcuts', JSON.stringify(updated));
  };

  const addShortcut = () => {
    const newShortcut: KeyboardShortcut = {
      id: crypto.randomUUID(),
      name: '',
      key: '',
      modifier: '',
      action: '',
    };
    saveShortcuts([...shortcuts, newShortcut]);
  };

  const updateShortcut = (id: string, updates: Partial<KeyboardShortcut>) => {
    const updated = shortcuts.map(s => s.id === id ? { ...s, ...updates } : s);
    saveShortcuts(updated);
  };

  const deleteShortcut = (id: string) => {
    const updated = shortcuts.filter(s => s.id !== id);
    saveShortcuts(updated);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Customize keyboard shortcuts
          </p>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Name"
                    value={shortcut.name}
                    onChange={(e) => updateShortcut(shortcut.id, { name: e.target.value })}
                    className="h-8 w-full"
                  />
                  <div className="flex gap-2">
                    <Input
                      placeholder="Key"
                      value={shortcut.key}
                      onChange={(e) => updateShortcut(shortcut.id, { key: e.target.value })}
                      className="h-8 flex-1"
                    />
                    <Input
                      placeholder="Action"
                      value={shortcut.action}
                      onChange={(e) => updateShortcut(shortcut.id, { action: e.target.value })}
                      className="h-8 flex-1"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteShortcut(shortcut.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={addShortcut}>
            <Plus className="w-4 h-4 mr-2" />
            Add Shortcut
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}