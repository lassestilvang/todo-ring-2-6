import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { LoginSchema } from '@/lib/validations';
import { getUserByEmail } from '@/db/operations';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

ensureDbInitialized();

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { email, password } = validated.data;

    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    if (!user.password) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Create JWT token
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return jsonSuccess({ user: userWithoutPassword, token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to login';
    return jsonError(message, 500, 'LOGIN_ERROR');
  }
}
