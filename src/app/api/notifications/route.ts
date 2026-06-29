import { NextResponse } from 'next/server';
import webPush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;

// Configure web-push
webPush.setVapidDetails(
  'mailto://taskplanner@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

// Simple endpoint to validate VAPID configuration
export async function GET() {
  try {
    // Verify we can construct a valid VAPID header
    const payload = JSON.stringify({ test: 'vapid-validation' });

    // Test sending to a dummy endpoint (won't actually send)
    const testEndpoint = 'https://updates.push.services.mozilla.com/wpush/v2/gb-test';
    const testKey = 'BPi3Z_UzumHD-4d9zHYq_Fb0P6hS7Y2yYuYbnFEQdfbiji78v0BrwPcPvTMZ41uxZo_yjbcDoUmfev5TUzBjBxk';
    const testAuth = 'test-auth-token';

    // This will throw if VAPID keys are invalid
    webPush.sendNotification(
      {
        endpoint: testEndpoint,
        keys: { p256dh: testKey, auth: testAuth }
      },
      payload
    );

    return NextResponse.json({
      success: true,
      message: 'VAPID configuration is valid'
    });
  } catch (error) {
    console.error('VAPID validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid VAPID configuration' },
      { status: 500 }
    );
  }
}

// Endpoint to send a test push notification (requires subscription)
export async function POST(request: Request) {
  try {
    const { subscription, payload } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription' },
        { status: 400 }
      );
    }

    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}