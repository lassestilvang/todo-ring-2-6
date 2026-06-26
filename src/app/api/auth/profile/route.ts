import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getUserById, updateUser } from '@/db/operations';
import { jwtVerify } from 'jose';

ensureDbInitialized();

const secret = new TextEncoder().encode(process.env.JWT_SECRET || '');

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable must be set in production');
}

export async function GET(_req: NextRequest) {
  try {
    const authHeader = _req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const user = getUserById(userId);
    if (!user) {
      return jsonError('User not found', 404, 'USER_NOT_FOUND');
    }

    const { password: _, ...userWithoutPassword } = user;
    return jsonSuccess(userWithoutPassword);
  } catch (error: unknown) {
    return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const authHeader = _req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const body = await _req.json();
    const updatedUser = updateUser(userId, body);

    const { password: _, ...userWithoutPassword } = updatedUser;
    return jsonSuccess(userWithoutPassword);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}
