'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsProps {
  onNewTask?: () => void;
  onSearch?: () => void;
  onToggleView?: () => void;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  onShowHelp?: () => void;
  onViewChange?: (view: 'list' | 'kanban' | 'calendar' | 'gantt') => void;
  onDismiss?: () => void;
  enableFocusMode?: () => void;
}

export function useKeyboardShortcuts({
  onNewTask,
  onSearch,
  onToggleView,
  onSelectAll,
  onSelectNone,
  onShowHelp,
  onViewChange,
  onDismiss,
  enableFocusMode,
}: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input/textarea
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isEditable = target.contentEditable === 'true';

    // Dismiss modals/dialogs
    if (e.key === 'Escape') {
      onDismiss?.();
      return;
    }

    // Global shortcuts
    if (!isInput && !isEditable) {
      // Meta/Cmd + N: New task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onNewTask?.();
        return;
      }

      // Meta/Cmd + K: Search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onSearch?.();
        return;
      }

      // V: Toggle view (list/kanban/calendar)
      if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggleView?.();
        return;
      }

      // C: Calendar view
      if (e.key === 'c' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onViewChange?.('calendar');
        return;
      }

      // L: List view
      if (e.key === 'l' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onViewChange?.('list');
        return;
      }

      // B: Board view
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onViewChange?.('kanban');
        return;
      }

      // G: Gantt view
      if (e.key === 'g' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onViewChange?.('gantt');
        return;
      }

      // A: Select all
      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSelectAll?.();
        return;
      }

      // Shift + A: Select none
      if (e.key === 'a' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSelectNone?.();
        return;
      }

      // F: Focus mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        // Don't interfere with browser search (Cmd+F)
        if (!isInput && !isEditable) {
          e.preventDefault();
          enableFocusMode?.();
          return;
        }
      }
    }

    // Question mark: Show help (no modifiers)
    if (e.key === '?' && !e.metaKey && !e.ctrlKey && !isInput) {
      e.preventDefault();
      onShowHelp?.();
    }
  }, [onNewTask, onSearch, onToggleView, onSelectAll, onSelectNone, onShowHelp, onViewChange, onDismiss, enableFocusMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}