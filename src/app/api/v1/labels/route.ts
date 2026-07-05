/**
 * API v1 Labels Route
 * Uses repository pattern
 */

import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';
import { LabelSchema } from '@/lib/validations';
import { getLabelRepository } from '@/lib/repositories';
import type { Label } from '@/types/index';

ensureDbInitialized();

export async function GET() {
  try {
    const labelRepo = getLabelRepository();
    const labels = labelRepo.findAll() as Label[];
    return jsonSuccess(labels);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch labels';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = LabelSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const labelRepo = getLabelRepository();
    const label = labelRepo.create(validated.data);
    return jsonSuccess(label, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create label';
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

    const validated = LabelSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(validated.error.errors.map(e => ({ path: e.path, message: e.message })));
    }

    const labelRepo = getLabelRepository();
    const label = labelRepo.update(id, validated.data);
    return jsonSuccess(label);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update label';
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

    const labelRepo = getLabelRepository();
    labelRepo.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete label';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}