/**
 * Mobile App Type Definitions
 */

// Task Types
export interface Task {
  id: string;
  title: string;
  description?: string;
  listId?: string;
  date?: string;
  deadline?: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  recurringType: 'none' | 'daily' | 'weekly' | 'weekdays' | 'monthly' | 'yearly' | 'custom';
  isAllDay: boolean;
  isHabit: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// List Types
export interface List {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  email: string;
}

// Auth Context
export interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Navigation Types
export interface RootStackParamList {
  Auth: undefined;
  Home: undefined;
  TaskDetail: { taskId: string };
  Analytics: undefined;
  Goals: undefined;
  Teams: undefined;
  Templates: undefined;
  TimeBlocking: undefined;
  Automation: undefined;
  FocusSessions: undefined;
  Profile: undefined;
}