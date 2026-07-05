/**
 * API v1 Auth Register Route
 * Uses repository pattern and proper JWT handling
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { RegisterSchema } from '@/lib/validations';
import { getUserRepository } from '@/lib/repositories';
import { hash } from 'bcryptjs';

ensureDbInitialized();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const { name, email, password } = validated.data;
    const userRepo = getUserRepository();

    // Check if user exists
    const existing = userRepo.findByEmail(email);
    if (existing) {
      return jsonError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    // Hash password and create user
    const hashedPassword = await hash(password, 12);
    const user = userRepo.create({ name, email, password: hashedPassword });

    return jsonSuccess({ user }, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to register';
    return jsonError(message, 500, 'REGISTER_ERROR');
  }
}