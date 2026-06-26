import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { RegisterSchema } from '@/lib/validations';
import { createUser, getUserByEmail } from '@/db/operations';
import bcrypt from 'bcryptjs';

ensureDbInitialized();

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { name, email, password } = validated.data;

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return jsonError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = createUser({
      name,
      email,
      password: hashedPassword,
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return jsonSuccess(userWithoutPassword, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to register';
    return jsonError(message, 500, 'REGISTER_ERROR');
  }
}
