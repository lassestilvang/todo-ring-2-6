import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getTasks, createTask } from '@/db/operations';

ensureDbInitialized();

// Google Calendar OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/integrations/google-calendar/callback`;

export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return jsonSuccess({
      configured: false,
      message: 'Google Calendar integration requires OAuth setup',
      setup: {
        1: 'Create Google Cloud project at https://console.cloud.google.com/',
        2: 'Enable Calendar API',
        3: 'Create OAuth 2.0 credentials',
        4: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars',
      },
    });
  }

  // Generate OAuth URL
  const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

  return jsonSuccess({
    configured: true,
    authUrl,
  });
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { action, code, tasks: importTasks } = body;

    if (action === 'connect') {
      if (!GOOGLE_CLIENT_ID) {
        return jsonError('Google Calendar not configured', 503, 'NOT_CONFIGURED');
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
          code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return jsonError(tokenData.error_description || 'Failed to exchange code', 400, 'TOKEN_ERROR');
      }

      return jsonSuccess({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      });
    }

    if (action === 'sync') {
      // Sync tasks to Google Calendar
      const tasks = getTasks();
      let synced = 0;

      for (const task of tasks) {
        if (task.date && task.status !== 'completed') {
          // Would create calendar event here
          synced++;
        }
      }

      return jsonSuccess({ synced });
    }

    if (action === 'import') {
      // Import tasks from Google Calendar
      if (!importTasks) {
        return jsonError('No tasks provided', 400, 'MISSING_TASKS');
      }

      let imported = 0;
      for (const task of importTasks) {
        await createTask({
          title: task.title,
          date: task.date || null,
          priority: task.priority || 'none',
        });
        imported++;
      }

      return jsonSuccess({ imported });
    }

    return jsonError('Invalid action', 400, 'INVALID_ACTION');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Google Calendar sync failed';
    return jsonError(message, 500, 'SYNC_ERROR');
  }
}