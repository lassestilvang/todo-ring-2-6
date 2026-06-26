import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const TasksContext = createContext();

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [lists, setLists] = useState([]);
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    // Check network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);

      // Sync when coming online
      if (state.isConnected && state.isInternetReachable && pendingSync.length > 0) {
        syncPendingChanges();
      }
    });

    // Load user from storage on mount
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
      setLoading(false);
    };
    loadUser();

    return () => unsubscribe();
  }, []);

  const syncPendingChanges = async (retryCount = 0) => {
    const pending = [...pendingSync];
    if (pending.length === 0) return;

    const results = [];

    for (const item of pending) {
      try {
        const res = await fetch(`http://localhost:3000/api/${item.entityType}s`, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: item.method !== 'DELETE' ? JSON.stringify(item.data) : undefined,
        });

        if (res.ok) {
          results.push(item.id);
        }
      } catch (error) {
        console.error('Sync error:', error);
        // Retry with exponential backoff for network errors
        if (retryCount < 3) {
          setTimeout(() => syncPendingChanges(retryCount + 1), Math.pow(2, retryCount) * 1000);
        }
      }
    }

    // Remove synced items
    setPendingSync(prev => prev.filter(item => !results.includes(item.id)));
  };

  const login = useCallback(async (email, password) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json.success) {
      const { user, token } = json.data;
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      setUser(user);
      setToken(token);
    }
    return json;
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }, []);

  const createTask = async (taskData) => {
    const tempId = `temp_${Date.now()}`;
    const newTask = { id: tempId, ...taskData, status: 'pending' };

    // Optimistically add to UI
    setTasks(prev => [newTask, ...prev]);

    if (!isOnline) {
      // Queue for sync
      setPendingSync(prev => [...prev, {
        id: tempId,
        entityType: 'tasks',
        method: 'POST',
        data: taskData,
      }]);
      return tempId;
    }

    try {
      const res = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(taskData),
      });

      const json = await res.json();
      if (json.success) {
        // Replace temp with real task
        setTasks(prev => prev.map(t => t.id === tempId ? json.data : t));
        return json.data.id;
      }
    } catch (error) {
      console.error('Create task error:', error);
    }

    return tempId;
  };

  const updateTask = async (id, updates) => {
    const originalTasks = [...tasks];

    // Optimistically update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    if (!isOnline) {
      setPendingSync(prev => [...prev, {
        id,
        entityType: 'tasks',
        method: 'PUT',
        data: { id, ...updates },
      }]);
      return;
    }

    try {
      await fetch('http://localhost:3000/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (error) {
      // Revert on error
      setTasks(originalTasks);
    }
  };

  const deleteTask = async (id) => {
    const originalTasks = [...tasks];

    // Optimistically delete
    setTasks(prev => prev.filter(t => t.id !== id));

    if (!isOnline) {
      setPendingSync(prev => [...prev, {
        id,
        entityType: 'tasks',
        method: 'DELETE',
        data: { id },
      }]);
      return;
    }

    try {
      await fetch(`http://localhost:3000/api/tasks?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      setTasks(originalTasks);
    }
  };

  const fetchTasks = useCallback(async (filters = {}) => {
    if (!token) return;

    const params = new URLSearchParams();
    if (filters.view) params.append('view', filters.view);
    if (filters.listId) params.append('listId', filters.listId);
    if (filters.search) params.append('search', filters.search);

    try {
      const res = await fetch(`http://localhost:3000/api/tasks?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
      }
    } catch (error) {
      console.error('Fetch tasks error:', error);
    }
  }, [token]);

  const fetchLists = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/lists', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLists(json.data);
      }
    } catch (error) {
      console.error('Fetch lists error:', error);
    }
  }, [token]);

  const fetchLabels = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/labels', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setLabels(json.data);
      }
    } catch (error) {
      console.error('Fetch labels error:', error);
    }
  }, [token]);

  return (
    <TasksContext.Provider value={{
      tasks,
      setTasks,
      lists,
      labels,
      loading,
      user,
      token,
      isOnline,
      pendingSync,
      login,
      logout,
      createTask,
      updateTask,
      deleteTask,
      fetchTasks,
      fetchLists,
      fetchLabels,
    }}>
      {children}
    </TasksContext.Provider>
  );
}