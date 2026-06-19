import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { generatePasswordResetToken } from '@/lib/auth-enhanced';
import { getUserByEmail } from '@/db/operations';
import { sendPasswordResetEmail } from '@/lib/email';
import { PasswordResetRequestSchema } from '@/lib/validations';

ensureDbInitialized();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = PasswordResetRequestSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { email } = validated.data;

    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not
      return jsonSuccess({ message: 'If the account exists, a reset email has been sent' });
    }

    // Generate reset token
    const token = await generatePasswordResetToken(user.id);

    // Send email (in production, use actual email service)
    await sendPasswordResetEmail(user.email, token);

    return jsonSuccess({ message: 'If the account exists, a reset email has been sent' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to send reset email';
    return jsonError(message, 500, 'RESET_ERROR');
  }
}