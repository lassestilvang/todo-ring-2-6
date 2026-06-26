import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getLabelRepository } from '@/lib/repositories';
import { LabelSchema } from '@/lib/validations';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();
const labelRepository = getLabelRepository();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      const labels = labelRepository.findByTask(taskId);
      return jsonSuccess(labels);
    }

    const labels = labelRepository.findAll();
    return jsonSuccess(labels);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch labels';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();

    if (body.action === 'assign') {
      if (!body.taskId || !body.labelId) {
        return jsonError('taskId and labelId are required', 400, 'MISSING_FIELDS');
      }
      labelRepository.assignToTask(body.taskId, body.labelId);
      const labels = labelRepository.findByTask(body.taskId);
      return jsonSuccess(labels);
    }

    if (body.action === 'remove') {
      if (!body.taskId || !body.labelId) {
        return jsonError('taskId and labelId are required', 400, 'MISSING_FIELDS');
      }
      labelRepository.removeFromTask(body.taskId, body.labelId);
      const labels = labelRepository.findByTask(body.taskId);
      return jsonSuccess(labels);
    }

    const validated = LabelSchema.safeParse(body);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }
    const newLabel = labelRepository.create(validated.data);
    return jsonSuccess(newLabel, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create label';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }

    const validated = LabelSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const updatedLabel = labelRepository.update(id, validated.data);
    return jsonSuccess(updatedLabel);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update label';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');
    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }
    labelRepository.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete label';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}