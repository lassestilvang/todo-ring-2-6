'use client';

import * as React from 'react';
import { HelpCircle, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeyboardShortcutCustomizer } from './keyboard-shortcut-customizer';

interface KeyboardShortcutHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette / Search' },
      { keys: ['T'], description: 'Go to Today view' },
      { keys: ['7'], description: 'Go to Next 7 Days view' },
      { keys: ['A'], description: 'Go to All Tasks view' },
      { keys: ['U'], description: 'Go to Upcoming tasks' },
      { keys: ['⌘', 'S'], description: 'Toggle sidebar' },
      { keys: ['Escape'], description: 'Close dialogs/modals' },
    ],
  },
  {
    category: 'Tasks',
    shortcuts: [
      { keys: ['⌘', 'N'], description: 'Create new task' },
      { keys: ['F'], description: 'Enter focus mode' },
      { keys: ['⇧', 'A'], description: 'Select all tasks on current view' },
      { keys: ['A'], description: 'Select/deselect individual task' },
      { keys: ['⌘', 'D'], description: 'Add dependency to task' },
      { keys: ['⌘', 'L'], description: 'Add label to task' },
    ],
  },
  {
    category: 'Views',
    shortcuts: [
      { keys: ['L'], description: 'Switch to list view' },
      { keys: ['B'], description: 'Switch to board (Kanban) view' },
      { keys: ['C'], description: 'Switch to calendar view' },
      { keys: ['G'], description: 'Switch to Gantt chart view' },
      { keys: ['V'], description: 'Toggle between views' },
    ],
  },
  {
    category: 'Task Management',
    shortcuts: [
      { keys: ['Space'], description: 'Toggle task completion' },
      { keys: ['⇧', 'Tab'], description: 'Move to next task' },
      { keys: ['Tab'], description: 'Move to previous task' },
    ],
  },
  {
    category: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show help' },
      { keys: ['Escape'], description: 'Close dialogs' },
    ],
  },
];

export function KeyboardShortcutHelp({ open, onOpenChange }: KeyboardShortcutHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-brand-500" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/60">
            Speed up your workflow with these handy shortcuts
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((category) => (
            <div key={category.category} className="space-y-3">
              <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.description}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/20"
                  >
                    <span className="text-sm text-muted-foreground/80">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 text-xs font-semibold bg-muted rounded-md shadow-inner"
                        >
                          {key === '⌘' ? 'Cmd' : key === '⇧' ? 'Shift' : key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50 flex justify-between">
            <KeyboardShortcutCustomizer />
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
}