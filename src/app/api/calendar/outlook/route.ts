import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';

ensureDbInitialized();

const AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || '';
const AZURE_AD_CLIENT_SECRET = process.env.AZURE_AD_CLIENT_SECRET || '';
const TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'common';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`;

// Microsoft OAuth URL
export async function GET(_req: NextRequest) {
  const { searchParams } = new URL(_req.url);
  const action = searchParams.get('action');

  if (action === 'auth') {
    // Redirect user to Microsoft OAuth
    const scope = 'Calendars.ReadWrite Calendars.ReadShared Calories.ReadWrite.Shared offline_access';
    const state = crypto.randomUUID();

    const authUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?` +
      `client_id=${AZURE_AD_CLIENT_ID}&` +
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

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code missing' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: AZURE_AD_CLIENT_ID,
          client_secret: AZURE_AD_CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
          code,
        }),
      }
    );

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
 * Sync tasks from Outlook Calendar
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

    // Fetch events from Outlook Calendar
    const calendarResponse = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarview?` +
      `startDateTime=${startDate || new Date().toISOString()}&` +
      `endDateTime=${endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}&` +
      `$orderby=start/dateTime`,
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

    // Transform Outlook events to tasks
    const tasks = calendarData.value.map((event: any) => ({
      id: event.id,
      title: event.subject || 'Untitled Event',
      description: event.bodyPreview || '',
      date: event.start?.dateTime?.split('T')[0],
      deadline: event.end?.dateTime?.split('T')[0],
      status: event.isCancelled ? 'cancelled' : 'pending',
      source: 'outlook_calendar',
      externalId: event.id,
      location: event.location?.displayName,
      attendees: event.attendees?.map((a: any) => a.emailAddress?.address),
    }));

    return NextResponse.json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error('Outlook Calendar sync error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}