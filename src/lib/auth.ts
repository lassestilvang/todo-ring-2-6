/**
 * Authentication utilities for TaskPlanner
 * Provides both client-side (localStorage) and server-side (JWT) auth
 */

import { randomUUID } from 'crypto';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============= Client-side localStorage Auth =============

/**
 * Generate a unique user ID (client-side)
 */
export function generateUserId(): string {
  return `user_${randomUUID().slice(0, 8)}`;
}

/**
 * Get current user from localStorage (client-side)
 */
export function getClientUser(): User | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem('taskplanner-user');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

/**
 * Set current user in localStorage (client-side)
 */
export function setClientUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('taskplanner-user', JSON.stringify(user));
}

/**
 * Clear current user from localStorage (client-side)
 */
export function clearClientUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('taskplanner-user');
}

/**
 * Create a guest user (client-side)
 */
export function createGuestUser(): User {
  const id = generateUserId();
  const suffix = id.slice(-4);
  const user: User = {
    id,
    name: `Guest ${suffix}`,
    email: `guest${suffix}@taskplanner.local`,
    createdAt: new Date().toISOString(),
  };
  setClientUser(user);
  return user;
}

// ============= Server-side JWT Auth =============
// These functions are only meant to be used in server-side code
// See server-auth.ts for database operations

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'taskplanner-secret-key-change-in-production';

/**
 * Generate a JWT token for user (server-side)
 */
export function generateToken(userId: string): string {
  const { createHmac } = require('crypto');
  const timestamp = Date.now().toString();
  const data = `${userId}:${timestamp}`;
  const signature = createHmac('sha256', JWT_SECRET).update(data).digest('hex');
  return `${userId}.${timestamp}.${signature}`;
}

/**
 * Verify token and return user ID (server-side)
 */
export function verifyToken(token: string): string | null {
  try {
    const { createHmac } = require('crypto');
    const [userId, timestamp, signature] = token.split('.');
    if (!userId || !timestamp || !signature) return null;

    const data = `${userId}:${timestamp}`;
    const expectedSignature = createHmac('sha256', JWT_SECRET).update(data).digest('hex');

    if (signature !== expectedSignature) return null;

    // Check if token is expired (7 days)
    const tokenAge = Date.now() - parseInt(timestamp);
    if (tokenAge > 7 * 24 * 60 * 60 * 1000) return null;

    return userId;
  } catch {
    return null;
  }
}