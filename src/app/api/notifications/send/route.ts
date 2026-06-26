import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getPushSubscriptionsForUser } from '@/db/operations';
import webPush from 'web-push';

// Configure web-push
webPush.setVapidDetails(
  'TaskPlanner <mailto:taskplanner@example.com>',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

ensureDbInitialized();

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { userId, title, body: message, icon, url } = body;

    if (!userId || !title) {
      return jsonError('userId and title are required', 400, 'MISSING_PARAMS');
    }

    // Get user's push subscriptions
    const subscriptions = getPushSubscriptionsForUser(userId);

    if (subscriptions.length === 0) {
      return jsonSuccess({ message: 'No subscriptions found' });
    }

    // Send push notifications
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            JSON.stringify({
              title,
              body: message,
              icon: icon || '/icon.png',
              url: url || '/',
            })
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return jsonSuccess({
      sent: successful,
      failed,
      results,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send notifications';
    return jsonError(message, 500, 'NOTIFICATION_ERROR');
  }
}
