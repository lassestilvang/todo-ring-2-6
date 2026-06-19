import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { setupMFA, enableMFA } from '@/lib/auth-enhanced';
import { getCurrentUser } from '@/lib/auth-enhanced';

ensureDbInitialized();

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return jsonError('Not authenticated', 401, 'UNAUTHORIZED');
    }

    const { action, code } = await req.json();

    if (action === 'setup') {
      // Generate MFA secret
      const { secret, qrCode } = await setupMFA(user.id);
      return jsonSuccess({ secret, qrCode });
    }

    if (action === 'enable') {
      if (!code) {
        return jsonError('Verification code required', 400, 'MISSING_CODE');
      }
      const success = await enableMFA(user.id, code);
      if (!success) {
        return jsonError('Invalid verification code', 400, 'INVALID_CODE');
      }
      return jsonSuccess({ message: 'MFA enabled successfully' });
    }

    return jsonError('Invalid action', 400, 'INVALID_ACTION');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'MFA setup failed';
    return jsonError(message, 500, 'MFA_ERROR');
  }
}