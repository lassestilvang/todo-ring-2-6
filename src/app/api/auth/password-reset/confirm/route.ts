import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { resetPassword } from '@/lib/auth-enhanced';
import { PasswordResetConfirmSchema } from '@/lib/validations';

ensureDbInitialized();

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = PasswordResetConfirmSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { token, newPassword } = validated.data;

    // Reset password
    const success = await resetPassword(token, newPassword);
    if (!success) {
      return jsonError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    return jsonSuccess({ message: 'Password has been reset successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset password';
    return jsonError(message, 500, 'RESET_ERROR');
  }
}