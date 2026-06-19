import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { createPushSubscription, deletePushSubscription, getDb } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// VAPID keys (generate your own for production)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh6U';

ensureDbInitialized();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return jsonError('Subscription and userId are required', 400, 'MISSING_FIELDS');
    }

    // Extract subscription details
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return jsonError('Invalid subscription format', 400, 'INVALID_SUBSCRIPTION');
    }

    const pushSub = createPushSubscription({
      userId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });

    return jsonSuccess(pushSub, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save subscription';
    return jsonError(message, 500, 'SUBSCRIPTION_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const id = searchParams.get('id');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const db = getDb();
    if (id) {
      deletePushSubscription(id);
    } else {
      // Delete all subscriptions for user
      db.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').run(userId);
    }

    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete subscription';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId) {
      const db = getDb();
      const subscriptions = db.prepare(
        'SELECT id, endpoint, created_at FROM push_subscriptions WHERE user_id = ?'
      ).all(userId);
      return jsonSuccess(subscriptions);
    }

    return jsonSuccess({ vapidPublicKey: VAPID_PUBLIC_KEY });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch subscriptions';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}