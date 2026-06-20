'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('taskplanner-token');
    const storedUser = localStorage.getItem('taskplanner-user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Login failed');
    }

    setToken(json.data.token);
    setUser(json.data.user);
    localStorage.setItem('taskplanner-token', json.data.token);
    localStorage.setItem('taskplanner-user', JSON.stringify(json.data.user));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Registration failed');
    }

    setToken(json.data.token);
    setUser(json.data.user);
    localStorage.setItem('taskplanner-token', json.data.token);
    localStorage.setItem('taskplanner-user', JSON.stringify(json.data.user));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('taskplanner-token');
    localStorage.removeItem('taskplanner-user');
  }, []);

  const refreshToken = useCallback(async () => {
    if (!token) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });

      const json = await res.json();
      if (json.success) {
        setToken(json.data.accessToken);
        localStorage.setItem('taskplanner-token', json.data.accessToken);
      }
    } catch (error) {
      logout();
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
