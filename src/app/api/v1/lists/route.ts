/**
 * API v1 Lists Route
 * Uses repository pattern
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { ListSchema } from '@/lib/validations';
import { getListRepository } from '@/lib/repositories';
import type { List } from '@/types/index';

ensureDbInitialized();

export async function GET() {
  try {
    const listRepo = getListRepository();
    const lists = listRepo.findAll() as List[];
    return jsonSuccess(lists);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lists';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = ListSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const listRepo = getListRepository();
    const list = listRepo.create(validated.data);
    return jsonSuccess(list, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create list';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const validated = ListSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const listRepo = getListRepository();
    const list = listRepo.update(id, validated.data);
    return jsonSuccess(list);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update list';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('ID is required', 400, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const listRepo = getListRepository();
    listRepo.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete list';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}