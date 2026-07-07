/**
 * Advanced Query Builder
 * Supports boolean logic (AND/OR), custom expressions, and saved filter presets
 */

import type { Task } from '@/types/index';

export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface FilterGroup {
  and?: FilterCondition[];
  or?: FilterCondition[];
}

export interface SavedFilter {
  id: string;
  name: string;
  icon?: string;
  filter: FilterGroup | string; // Can be JSON stringified
  createdAt: string;
  updatedAt: string;
}

/**
 * Evaluate a single condition against a task
 */
function evaluateCondition(task: Task, condition: FilterCondition): boolean {
  const fieldValue = getFieldValue(task, condition.field);

  switch (condition.operator) {
    case 'eq':
      return fieldValue === condition.value;
    case 'ne':
      return fieldValue !== condition.value;
    case 'gt':
      return fieldValue > condition.value;
    case 'gte':
      return fieldValue >= condition.value;
    case 'lt':
      return fieldValue < condition.value;
    case 'lte':
      return fieldValue <= condition.value;
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
    case 'startsWith':
      return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase());
    case 'endsWith':
      return String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase());
    default:
      return true;
  }
}

/**
 * Get field value from task (supports nested fields and computed fields)
 */
function getFieldValue(task: Task, field: string): any {
  // Handle computed fields
  if (field === 'isOverdue') {
    return task.deadline ? new Date(task.deadline) < new Date() : false;
  }
  if (field === 'isDueToday') {
    return task.deadline ? task.deadline === new Date().toISOString().split('T')[0] : false;
  }
  if (field === 'hasSubtasks') {
    return !!task.subtasks?.length;
  }

  // Handle standard fields
  const parts = field.split('.');
  let value: any = task;
  for (const part of parts) {
    value = value?.[part];
  }
  return value;
}

/**
 * Apply advanced filter to a list of tasks
 */
export function applyAdvancedFilter(tasks: Task[], filter: FilterGroup | string): Task[] {
  const parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;

  return tasks.filter(task => {
    let match = true;

    // AND conditions - all must be true
    if (parsedFilter.and) {
      match = parsedFilter.and.every((condition: FilterCondition) =>
        evaluateCondition(task, condition)
      );
    }

    // OR conditions - at least one must be true
    if (parsedFilter.or && !match) {
      match = parsedFilter.or.some((condition: FilterCondition) =>
        evaluateCondition(task, condition)
      );
    }

    return match;
  });
}

/**
 * Parse natural language filter expression
 * Examples:
 *   - "status:pending AND priority:high"
 *   - "priority:high OR priority:medium"
 *   - "dueBefore:2024-01-01 OR dueAfter:2024-12-31"
 */
export function parseFilterExpression(expression: string): FilterGroup {
  const andParts = expression.split(/\s+AND\s+/i);

  if (andParts.length > 1) {
    // Has AND operators
    const andConditions = parseConditions(andParts.join(' OR '));
    return { and: andConditions };
  }

  // Check for OR operators
  const conditions = parseConditions(expression);
  return { or: conditions };
}

function parseConditions(expression: string): FilterCondition[] {
  const conditions: FilterCondition[] = [];
  const orParts = expression.split(/\s+OR\s+/i);

  for (const part of orParts) {
    const match = part.match(/(\w+):(.+)/);
    if (match) {
      const [, field, value] = match;
      conditions.push({
        field,
        operator: 'eq',
        value: normalizeValue(value.trim()),
      });
    }
  }

  return conditions;
}

function normalizeValue(value: string): any {
  // Try to parse as number
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

  // Handle boolean-like values
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;

  // Return string as-is
  return value;
}

/**
 * Create a saved filter
 */
export function createSavedFilter(name: string, filter: FilterGroup | string, icon?: string): SavedFilter {
  return {
    id: crypto.randomUUID(),
    name,
    icon,
    filter,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Common filter presets
 */
export const FILTER_PRESETS = {
  overdue: {
    name: 'Overdue Tasks',
    filter: { and: [{ field: 'isOverdue', operator: 'eq', value: true }] },
  },
  dueToday: {
    name: 'Due Today',
    filter: { and: [{ field: 'isDueToday', operator: 'eq', value: true }] },
  },
  highPriority: {
    name: 'High Priority',
    filter: { and: [{ field: 'priority', operator: 'eq', value: 'high' }] },
  },
  incomplete: {
    name: 'Incomplete',
    filter: { or: [
      { field: 'status', operator: 'eq', value: 'pending' },
      { field: 'status', operator: 'eq', value: 'in_progress' },
    ]},
  },
};