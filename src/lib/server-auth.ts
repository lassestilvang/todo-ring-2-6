/**
 * Server-side authentication utilities
 * This file should only be imported in server-side code (API routes, server components)
 */

import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'taskplanner-secret-key-change-in-production';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

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

/**
 * Get current user from request (server-side)
 */
export async function getCurrentUser(request: any): Promise<User | null> {
  const authHeader = request.headers?.get?.('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const userId = verifyToken(token);
  if (!userId) return null;

  // Dynamic import to avoid bundling issues
  const { getUserById } = await import('@/db/operations');
  return getUserById(userId);
}

/**
 * Create or get user by email (server-side)
 */
export async function getOrCreateUser(email: string, name?: string, avatar?: string): Promise<User> {
  // Dynamic import to avoid bundling issues
  const { getUserByEmail, createUser } = await import('@/db/operations');
  let user = getUserByEmail(email);

  if (!user) {
    user = createUser({ name: name || email.split('@')[0], email, avatar });
  }

  return user;
}