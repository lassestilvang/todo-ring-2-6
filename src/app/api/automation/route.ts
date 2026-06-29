import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getAutomationRuleRepository } from '@/lib/repositories';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { AutomationRuleSchema } from '@/lib/validations';

ensureDbInitialized();
const automationRepository = getAutomationRuleRepository();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');

    const rules = userId
      ? automationRepository.findAll(userId)
      : automationRepository.findAll();

    return jsonSuccess(rules);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch automation rules';
    return jsonError(message, 500, 'AUTOMATION_ERROR');
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const validated = AutomationRuleSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const rule = automationRepository.create({
      userId: validated.data.userId,
      name: validated.data.name,
      triggerType: validated.data.triggerType,
      triggerValue: validated.data.triggerValue,
      actionType: validated.data.actionType,
      actionValue: validated.data.actionValue,
      isEnabled: validated.data.isEnabled,
    });

    return jsonSuccess(rule, 201);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create automation rule';
    return jsonError(message, 500, 'AUTOMATION_ERROR');
  }
}

export async function PUT(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { id, ...data } = body;

    if (!id) {
      return jsonError('Rule ID is required', 400, 'MISSING_ID');
    }

    const validated = AutomationRuleSchema.partial().safeParse(data);
    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const rule = automationRepository.update(id, validated.data);
    return jsonSuccess(rule);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update automation rule';
    return jsonError(message, 500, 'AUTOMATION_ERROR');
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const id = searchParams.get('id');

    if (!id) {
      return jsonError('Rule ID is required', 400, 'MISSING_ID');
    }

    automationRepository.delete(id);
    return jsonSuccess({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete automation rule';
    return jsonError(message, 500, 'AUTOMATION_ERROR');
  }
}