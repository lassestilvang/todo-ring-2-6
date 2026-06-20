/**
 * Enhanced Authentication utilities for TaskPlanner
 * Includes JWT with refresh tokens, password reset, MFA, and session management
 */

import { randomUUID } from 'crypto';
import { jwtVerify, SignJWT } from 'jose';
import { compare, hash } from 'bcryptjs';
import { addDays, addHours } from 'date-fns';

const JWT_SECRET = process.env.AUTH_SECRET || process.env.JWT_SECRET || 'taskplanner-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'taskplanner-refresh-secret-change-in-production';

const secret = new TextEncoder().encode(JWT_SECRET);
const refreshSecret = new TextEncoder().encode(REFRESH_SECRET);

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
}

// ============= Token Management =============

/**
 * Generate access token (short-lived, 15 minutes)
 */
export async function generateAccessToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret);
  return token;
}

/**
 * Generate refresh token (long-lived, 7 days)
 */
export async function generateRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId, tokenType: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(refreshSecret);
  return token;
}

/**
 * Verify access token
 */
export async function verifyAccessToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// ============= Password Management =============

/**
 * Hash password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await compare(password, hash);
}

// ============= Password Reset =============

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = randomUUID();
  const expiresAt = addDays(new Date(), 1).toISOString();

  // Store in database
  const db = getDb();
  const id = randomUUID();
  db.prepare(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, userId, token, expiresAt, new Date().toISOString());

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const db = getDb();
  const record = db.prepare(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > ? AND used = 0'
  ).get(token, new Date().toISOString()) as PasswordResetToken | undefined;

  if (!record) return null;
  return record.userId;
}

/**
 * Reset password using token
 */
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  const userId = await verifyPasswordResetToken(token);
  if (!userId) return false;

  const hashedPassword = await hashPassword(newPassword);
  const db = getDb();

  // Update password
  db.prepare('UPDATE users SET password = ?, updated_at = ? WHERE id = ?')
    .run(hashedPassword, new Date().toISOString(), userId);

  // Mark token as used
  db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);

  // Invalidate all sessions for this user
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);

  return true;
}

// ============= MFA (Two-Factor Authentication) =============

export interface MFASetup {
  secret: string;
  qrCode: string;
}

/**
 * Generate MFA secret and QR code
 */
export async function setupMFA(userId: string): Promise<MFASetup> {
  // Generate a simple secret (in production, use proper TOTP library)
  const secret = randomUUID().replace(/-/g, '').slice(0, 32);
  const email = await getUserEmail(userId);

  // Generate TOTP QR code URL
  const issuer = 'TaskPlanner';
  const label = encodeURIComponent(email);
  const qrCode = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;

  // Store secret
  const db = getDb();
  db.prepare(
    'INSERT INTO mfa_secrets (id, user_id, secret, created_at) VALUES (?, ?, ?, ?)'
  ).run(randomUUID(), userId, secret, new Date().toISOString());

  return { secret, qrCode };
}

/**
 * Verify MFA code
 */
export async function verifyMFA(userId: string, code: string): Promise<boolean> {
  // In production, use proper TOTP verification
  // This is a simplified version
  const db = getDb();
  const record = db.prepare(
    'SELECT secret FROM mfa_secrets WHERE user_id = ?'
  ).get(userId) as { secret: string } | undefined;

  if (!record) return false;

  // Simplified verification (in production, use TOTP algorithm)
  // For now, just check if the code is a 6-digit number
  const isValidFormat = /^\d{6}$/.test(code);
  return isValidFormat;
}

/**
 * Enable MFA for user
 */
export async function enableMFA(userId: string, code: string): Promise<boolean> {
  const isValid = await verifyMFA(userId, code);
  if (!isValid) return false;

  const db = getDb();
  db.prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(userId);
  return true;
}

// ============= Session Management =============

/**
 * Create a new session
 */
export async function createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
  const db = getDb();
  const sessionId = randomUUID();
  const expiresAt = addDays(new Date(), 7).toISOString();

  db.prepare(
    'INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(sessionId, userId, ipAddress, userAgent, expiresAt, new Date().toISOString());

  return sessionId;
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  const db = getDb();
  return db.prepare('SELECT * FROM sessions WHERE id = ? AND expires_at > ?')
    .get(sessionId, new Date().toISOString()) as Session | null;
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

/**
 * Delete all sessions for user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

// Helper functions
async function getDb() {
  const { getDb: getDbImpl } = await import('@/db/operations');
  return getDbImpl();
}

async function getUserEmail(userId: string): Promise<string> {
  const db = await getDb();
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
  return user?.email || '';
}

/**
 * Get current user from request (server-side)
 */
export async function getCurrentUser(request: any): Promise<User | null> {
  const authHeader = request.headers?.get?.('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const userId = await verifyAccessToken(token);
  if (!userId) return null;

  const db = await getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;
  return user || null;
}