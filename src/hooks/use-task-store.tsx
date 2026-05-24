'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface TaskContextType {
  // State
  activeView: string;
  activeList: string | null;
  searchQuery: string;
  showCompleted: boolean;
  tasks: any[];
  lists: any[];
  labels: any[];
  stats: any;
  isLoading: boolean;
  
  // Actions
  setActiveView: (view: string) => void;
  setActiveList: (listId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowCompleted: (show: boolean) => void;
  setTasks: (tasks: any[]) => void;
  setLists: (lists: any[]) => void;
  setLabels: (labels: any[]) => void;
  setStats: (stats: any) => void;
  
  // Task operations
  addTask: (task: any) => void;
  updateTaskInStore: (id: string, updates: Partial<any>) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState('today');
  const [activeList, setActiveList] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, completed: 0, pending: 0, inProgress: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const addTask = useCallback((task: any) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const updateTaskInStore = useCallback((id: string, updates: Partial<any>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'completed' ? 'pending' : 'completed';
        return { ...t, status: newStatus, completedAt: newStatus === 'completed' ? new Date().toISOString() : null };
      }
      return t;
    }));
  }, []);

  return (
    <TaskContext.Provider value={{
      activeView, setActiveView,
      activeList, setActiveList,
      searchQuery, setSearchQuery,
      showCompleted, setShowCompleted,
      tasks, setTasks,
      lists, setLists,
      labels, setLabels,
      stats, setStats,
      isLoading,
      addTask, updateTaskInStore, removeTask, toggleTask,
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