import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTemplateRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError } from '@/lib/api-response';

ensureDbInitialized();
const templateRepository = getTemplateRepository();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPublic = searchParams.get('public');
    const myTemplates = searchParams.get('myTemplates');
    const sortBy = searchParams.get('sortBy') || 'usage_count';
    const limit = parseInt(searchParams.get('limit') || '50');

    let templates;

    if (category) {
      templates = templateRepository.findByCategory(category, sortBy, limit);
    } else if (myTemplates) {
      templates = templateRepository.findByCreatedBy(myTemplates);
    } else {
      templates = templateRepository.findAll(sortBy as any, limit);
    }

    // Filter for public templates if requested
    if (isPublic === 'true') {
      templates = templates.filter(t => t.isPublic);
    }

    // Filter by search if provided
    if (search) {
      const lowerSearch = search.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(lowerSearch) ||
        t.title.toLowerCase().includes(lowerSearch)
      );
    }

    return jsonSuccess(templates);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch templates';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();

    const template = templateRepository.create({
      name: body.name,
      icon: body.icon,
      title: body.title,
      description: body.description,
      priority: body.priority,
      estimateHours: body.estimateHours,
      estimateMinutes: body.estimateMinutes,
      isAllDay: body.isAllDay,
      recurringType: body.recurringType,
      labelIds: body.labelIds,
      category: body.category,
      createdBy: body.createdBy,
    });

    return jsonSuccess(template, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create template';
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

    const template = templateRepository.update(id, {
      name: data.name,
      icon: data.icon,
      title: data.title,
      description: data.description,
      priority: data.priority,
      estimateHours: data.estimateHours,
      estimateMinutes: data.estimateMinutes,
      isAllDay: data.isAllDay,
      recurringType: data.recurringType,
      labelIds: data.labelIds,
      category: data.category,
    });

    // Update usage count
    templateRepository.updateUsageCount(id);

    return jsonSuccess(template);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update template';
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

    templateRepository.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete template';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}