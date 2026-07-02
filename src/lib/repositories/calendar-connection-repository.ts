/**
 * Calendar Connection Repository
 * Handles all database operations related to calendar connections
 */

import { getDb } from '../../db/index';
import type { CalendarConnection } from '@/types/index';

export class CalendarConnectionRepository {
  private db = getDb();

  findByUserId(userId: string): CalendarConnection[] {
    return this.db.prepare(
      'SELECT * FROM calendar_connections WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId) as CalendarConnection[];
  }

  findById(id: string): CalendarConnection | undefined {
    return this.db.prepare('SELECT * FROM calendar_connections WHERE id = ?').get(id) as CalendarConnection | undefined;
  }

  findByProvider(userId: string, provider: 'google' | 'outlook' | 'ical'): CalendarConnection | undefined {
    return this.db.prepare(
      'SELECT * FROM calendar_connections WHERE user_id = ? AND provider = ?'
    ).get(userId, provider) as CalendarConnection | undefined;
  }

  create(userId: string, data: {
    provider: 'google' | 'outlook' | 'ical';
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
  }): CalendarConnection {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    this.db.prepare(
      'INSERT INTO calendar_connections (id, user_id, provider, access_token, refresh_token, expires_at, created_at)'
    ).run(id, userId, data.provider, data.accessToken, data.refreshToken || null, data.expiresAt || null, now);

    return this.findById(id)!;
  }

  update(id: string, data: Partial<{
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
  }>): CalendarConnection {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.accessToken !== undefined) { updates.push('access_token = ?'); values.push(data.accessToken); }
    if (data.refreshToken !== undefined) { updates.push('refresh_token = ?'); values.push(data.refreshToken); }
    if (data.expiresAt !== undefined) { updates.push('expires_at = ?'); values.push(data.expiresAt); }

    values.push(id);

    this.db.prepare(`UPDATE calendar_connections SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM calendar_connections WHERE id = ?').run(id);
    return result.changes > 0;
  }

  deleteByUserId(userId: string): void {
    this.db.prepare('DELETE FROM calendar_connections WHERE user_id = ?').run(userId);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(connection: CalendarConnection): boolean {
    if (!connection.expiresAt) return false;
    return new Date(connection.expiresAt) < new Date();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(connection: CalendarConnection): Promise<string | null> {
    if (!connection.refreshToken) return null;

    const provider = connection.provider;
    let tokenUrl: string;
    let params: URLSearchParams;

    switch (provider) {
      case 'google':
        tokenUrl = 'https://oauth2.googleapis.com/token';
        params = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID || '',
          client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
          refresh_token: connection.refreshToken,
          grant_type: 'refresh_token',
        });
        break;
      case 'outlook':
        tokenUrl = `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID || 'common'}/oauth2/v2.0/token`;
        params = new URLSearchParams({
          client_id: process.env.AZURE_AD_CLIENT_ID || '',
          client_secret: process.env.AZURE_AD_CLIENT_SECRET || '',
          refresh_token: connection.refreshToken,
          grant_type: 'refresh_token',
        });
        break;
      default:
        return null;
    }

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) return null;

    const data = await response.json();
    this.update(connection.id, {
      accessToken: data.access_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    });

    return data.access_token;
  }
}

let calendarConnectionRepository: CalendarConnectionRepository | null = null;

export function getCalendarConnectionRepository(): CalendarConnectionRepository {
  if (!calendarConnectionRepository) {
    calendarConnectionRepository = new CalendarConnectionRepository();
  }
  return calendarConnectionRepository;
}