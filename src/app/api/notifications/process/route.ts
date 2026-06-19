import { NextRequest } from 'next/server';
import { processPendingNotifications } from '@/lib/notifications';
import { jsonSuccess, jsonError } from '@/lib/api-response';

export async function POST(_req: NextRequest) {
  try {
    // In production, this would be protected by an API key or admin auth
    // For now, we'll process without authentication
    const result = await processPendingNotifications();
    return jsonSuccess(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process notifications';
    return jsonError(message, 500, 'NOTIFICATION_ERROR');
  }
}