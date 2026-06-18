import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getAllLabels, createLabel, updateLabel as dbUpdateLabel, deleteLabel as dbDeleteLabel, getTaskLabels, addLabelToTask, removeLabelFromTask } from '@/db/operations';
import { LabelSchema } from '@/lib/validations';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');

    if (taskId) {
      const labels = getTaskLabels(taskId);
      return jsonSuccess(labels);
    }

    const labels = getAllLabels();
    return jsonSuccess(labels);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch labels';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'assign') {
      if (!body.taskId || !body.labelId) {
        return jsonError('taskId and labelId are required', 400, 'MISSING_FIELDS');
      }
      addLabelToTask(body.taskId, body.labelId);
      const labels = getTaskLabels(body.taskId);
      return jsonSuccess(labels);
    }

    if (body.action === 'remove') {
      if (!body.taskId || !body.labelId) {
        return jsonError('taskId and labelId are required', 400, 'MISSING_FIELDS');
      }
      removeLabelFromTask(body.taskId, body.labelId);
      const labels = getTaskLabels(body.taskId);
      return jsonSuccess(labels);
    }

    const validated = LabelSchema.safeParse(body);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }
    const newLabel = createLabel(validated.data);
    return jsonSuccess(newLabel, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create label';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
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

    const updatedLabel = dbUpdateLabel(id, validated.data);
    return jsonSuccess(updatedLabel);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update label';
    return jsonError(message, 500, 'UPDATE_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return jsonError('ID is required', 400, 'MISSING_ID');
    }
    dbDeleteLabel(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete label';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}