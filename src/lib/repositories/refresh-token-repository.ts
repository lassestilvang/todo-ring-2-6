/**
 * Refresh Token Repository
 * Handles all database operations related to JWT refresh tokens
 */

import { getDb } from '../../db/index';
import type { RefreshToken, TokenInfo } from '@/types/index';
import { generateJwt } from '@/lib/jwt';
import crypto from 'crypto';

export class RefreshTokenRepository {
  private db = getDb();

  findById(id: string): RefreshToken | undefined {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE id = ? AND expires_at > ?'
    ).get(id, new Date().toISOString()) as RefreshToken | undefined;
  }

  findByToken(token: string): RefreshToken | undefined {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > ?'
    ).get(token, new Date().toISOString()) as RefreshToken | undefined;
  }

  findByUserId(userId: string): RefreshToken[] {
    return this.db.prepare(
      'SELECT * FROM refresh_tokens WHERE user_id = ? AND expires_at > ? ORDER BY created_at DESC'
    ).all(userId, new Date().toISOString()) as RefreshToken[];
  }

  create(userId: string): RefreshToken {
    const id = crypto.randomUUID();
    const token = crypto.randomUUID();
    const now = new Date().toISOString();
    // Short-lived refresh token that expires in 1 hour
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();

    this.db.prepare(
      'INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, userId, token, expiresAt, now);

    return this.findById(id)!;
  }

  updateRotation(userId: string): RefreshToken {
    // Delete expired tokens for user
    this.deleteExpired();

    // Find existing tokens and rotate out older ones
    const tokens = this.findByUserId(userId);
    const now = new Date();

    // Keep only the most recent token, rotate others
    tokens.forEach(token => {
      if (token.id !== tokens[0].id) { // If not the newest token
        this.delete(token.id);
      }
    }

    // Create new short-lived token
    return this.create(userId);
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(id);
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
  }

  deleteByToken(token: string): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
  }

  deleteExpired(): void {
    this.db.prepare('DELETE FROM refresh_tokens WHERE expires_at < ?').run(new Date().toISOString());
  }

  /**
   * Create a new access token using refresh token if valid
   */
  async rotateRefreshToken(token: string, userId: string): Promise<string> {
    const storedToken = this.findByToken(token)?.[0];
    if (!storedToken || storedToken.user_id !== userId) {
      throw new Error('Invalid refresh token');
    }

    // Delete the used token to force rotation
    this.delete(token);

    // Create new refresh token immediately
    const newRefresh = this.create(userId);

    // Create a new short access token
    const newAccessToken = await generateJwt({ sub: userId }, '10m');
    return newAccessToken;
  }

  /**
   * Get token info for rate limiting and security tracking
   */
  async getTokenInfo(tokenId: string): Promise<TokenInfo | null> {
    const token = this.findById(tokenId);
    if (!token) return null;

    const now = new Date();
    const expiresInMs = new Date(token.expires_at).getTime() - now.getTime();

    return {
      id: token.id,
      userId: token.user_id,
      createdAt: token.created_at,
      expiresAt: token.expires_at,
      expiresInMs,
      isExpired: expiresInMs < 0,
    };
  }
}

let refreshTokenRepository: RefreshTokenRepository | null = null;

export function getRefreshTokenRepository(): RefreshTokenRepository {
  if (!refreshTokenRepository) {
    refreshTokenRepository = new RefreshTokenRepository();
  }
  return refreshTokenRepository;
}