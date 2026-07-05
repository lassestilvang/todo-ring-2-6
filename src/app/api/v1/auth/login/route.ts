/**
 * API v1 Auth Login Route
 * Uses repository pattern and proper JWT handling
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { LoginSchema } from '@/lib/validations';
import { getUserRepository } from '@/lib/repositories';
import { compare } from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth-enhanced';

ensureDbInitialized();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = LoginSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const { email, password } = validated.data;
    const userRepo = getUserRepository();
    const user = userRepo.findByEmail(email);

    if (!user?.password) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
      return jsonError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = await generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    const { password: _, ...userWithoutPassword } = user;

    return jsonSuccess({ user: userWithoutPassword, token, refreshToken });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to login';
    return jsonError(message, 500, 'LOGIN_ERROR');
  }
}