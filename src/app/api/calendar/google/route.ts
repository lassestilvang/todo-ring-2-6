import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/index';

ensureDbInitialized();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/google/callback`;

// Google OAuth URL
export async function GET(_req: NextRequest) {
  const { searchParams } = new URL(_req.url);
  const action = searchParams.get('action');

  if (action === 'auth') {
    // Redirect user to Google OAuth
    const scope = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';
    const state = crypto.randomUUID();

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${REDIRECT_URI}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `state=${state}`;

    return NextResponse.json({ authUrl, state });
  }

  if (action === 'callback') {
    // Handle OAuth callback
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code missing' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
        code,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to exchange token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });
  }

  return NextResponse.json({ success: true });
}

/**
 * Sync tasks from Google Calendar
 */
export async function POST(_req: NextRequest) {
  try {
    const { accessToken, startDate, endDate } = await _req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Access token required' },
        { status: 400 }
      );
    }

    // Fetch events from Google Calendar
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${startDate || new Date().toISOString()}&` +
      `timeMax=${endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!calendarResponse.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const calendarData = await calendarResponse.json();

    // Transform Google Calendar events to tasks
    const tasks = calendarData.items.map((event: any) => ({
      id: event.id,
      title: event.summary || 'Untitled Event',
      description: event.description || '',
      date: event.start?.dateTime?.split('T')[0] || event.start?.date,
      deadline: event.end?.dateTime?.split('T')[0] || event.end?.date,
      status: event.status === 'cancelled' ? 'cancelled' : 'pending',
      source: 'google_calendar',
      externalId: event.id,
      location: event.location,
      attendees: event.attendees?.map((a: any) => a.email),
    }));

    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Google Calendar sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}