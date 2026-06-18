'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface TaskContextType {
  // UI State (not data)
  activeView: string;
  activeList: string | null;
  activeLabel: string | null;
  searchQuery: string;
  showCompleted: boolean;
  selectedTasks: Set<string>;
  isSelectionMode: boolean;

  // Actions
  setActiveView: (view: string) => void;
  setActiveList: (listId: string | null) => void;
  setActiveLabel: (labelId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowCompleted: (show: boolean) => void;
  selectTask: (id: string) => void;
  selectAllTasks: (ids: string[]) => void;
  clearSelection: () => void;
  toggleSelectionMode: (enabled: boolean) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState('today');
  const [activeList, setActiveList] = useState<string | null>(null);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const selectTask = useCallback((id: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAllTasks = useCallback((ids: string[]) => {
    setSelectedTasks(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set());
    setIsSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback((enabled: boolean) => {
    setIsSelectionMode(enabled);
    if (!enabled) {
      setSelectedTasks(new Set());
    }
  }, []);

  return (
    <TaskContext.Provider value={{
      activeView, setActiveView,
      activeList, setActiveList,
      activeLabel, setActiveLabel,
      searchQuery, setSearchQuery,
      showCompleted, setShowCompleted,
      selectedTasks,
      isSelectionMode,
      selectTask,
      selectAllTasks,
      clearSelection,
      toggleSelectionMode,
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskStore() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskStore must be used within a TaskProvider');
  }
  return context;
}