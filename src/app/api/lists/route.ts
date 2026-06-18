import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getAllLists, createList, updateList, deleteList, updateListSortOrder } from '@/db/operations';
import { ListSchema, ListReorderSchema } from '@/lib/validations';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';

// Ensure database is initialized
ensureDbInitialized();

export async function GET() {
  try {
    const lists = getAllLists();
    return jsonSuccess(lists);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch lists';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ListSchema.safeParse(body);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }
    const newList = createList(validated.data);
    return jsonSuccess(newList, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create list';
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

    const validated = ListSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const updatedList = updateList(id, validated.data);
    return jsonSuccess(updatedList);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update list';
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
    deleteList(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete list';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle reorder
    if (body.listId && body.newPosition !== undefined) {
      const validated = ListReorderSchema.safeParse(body);
      if (!validated.success) {
        return jsonValidationError(
          validated.error.errors.map(e => ({ path: e.path, message: e.message }))
        );
      }
      updateListSortOrder(body.listId, body.newPosition);
      return jsonSuccess({ success: true });
    }

    return jsonError('Invalid request body', 400, 'INVALID_REQUEST');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process request';
    return jsonError(message, 500, 'PROCESS_ERROR');
  }
}