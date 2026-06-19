import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getUserById, createMfaSecret, getMfaSecret, verifyTotp, deleteMfaSecret, getDb } from '@/db/operations';
import { generateSecret, generateQRCode } from '@/lib/totp';

ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const user = getUserById(userId);
    if (!user) {
      return jsonError('User not found', 404, 'USER_NOT_FOUND');
    }

    const secret = getMfaSecret(userId);
    const isEnabled = !!secret;

    // If not enabled, generate a new secret for setup
    if (!secret) {
      const newSecret = generateSecret();
      const qrCode = await generateQRCode(newSecret, user.email);
      return jsonSuccess({
        isEnabled: false,
        secret: newSecret,
        qrCode,
        email: user.email,
      });
    }

    return jsonSuccess({
      isEnabled: true,
      email: user.email,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get MFA status';
    return jsonError(message, 500, 'MFA_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, action, code } = body;

    if (!userId || !action) {
      return jsonError('userId and action are required', 400, 'MISSING_PARAMS');
    }

    const user = getUserById(userId);
    if (!user) {
      return jsonError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (action === 'setup') {
      const secret = generateSecret();
      const qrCode = await generateQRCode(secret, user.email);
      createMfaSecret(userId, secret);
      return jsonSuccess({ secret, qrCode });
    }

    if (action === 'verify') {
      if (!code) {
        return jsonError('code is required for verification', 400, 'MISSING_CODE');
      }

      const secret = getMfaSecret(userId);
      if (!secret) {
        return jsonError('MFA not set up', 400, 'MFA_NOT_SETUP');
      }

      if (!verifyTotp(secret.secret, code)) {
        return jsonError('Invalid code', 400, 'INVALID_CODE');
      }

      // Enable MFA for user
      getDb().prepare('UPDATE users SET mfa_enabled = 1 WHERE id = ?').run(userId);

      return jsonSuccess({ success: true, message: 'MFA enabled successfully' });
    }

    if (action === 'disable') {
      deleteMfaSecret(userId);
      getDb().prepare('UPDATE users SET mfa_enabled = 0 WHERE id = ?').run(userId);
      return jsonSuccess({ success: true, message: 'MFA disabled' });
    }

    return jsonError('Invalid action', 400, 'INVALID_ACTION');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process MFA request';
    return jsonError(message, 500, 'MFA_ERROR');
  }
}
