import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { getAllTasks, getAllLists, getAllLabels } from '@/db/operations';
import { generateCSV, generateMarkdown, generateICS } from '@/lib/export';

ensureDbInitialized();

interface ScheduledExport {
  id: string;
  userId: string;
  format: 'json' | 'csv' | 'markdown' | 'ics' | 'pdf';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  nextRun: string;
  enabled: boolean;
}

/**
 * GET /api/export/scheduled
 * Get scheduled export configurations
 */
export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    // In-memory storage for scheduled exports (use database in production)
    const scheduledExports = getScheduledExports(userId);

    return jsonSuccess(scheduledExports);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch scheduled exports';
    return jsonError(message, 500, 'FETCH_ERROR');
  }
}

/**
 * POST /api/export/scheduled
 * Create a scheduled export
 */
export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const { userId, format, frequency, time } = body;

    if (!userId || !format || !frequency || !time) {
      return jsonError('Missing required fields', 400, 'MISSING_FIELDS');
    }

    const exportData = prepareExportData();
    const exportContent = getExportContent(exportData, format);

    // Save the configuration
    const scheduledExport = createScheduledExport({
      userId,
      format,
      frequency,
      time,
    });

    // In production: queue this for background processing
    // For now, return the export content directly
    return jsonSuccess({
      ...scheduledExport,
      exportContent,
      message: 'Scheduled export created. Would be sent via email when triggered.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create scheduled export';
    return jsonError(message, 500, 'CREATE_ERROR');
  }
}

function prepareExportData() {
  const tasks = getAllTasks() as any[];
  const lists = getAllLists();
  const labels = getAllLabels();

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tasks,
    lists,
    labels,
    metadata: {
      totalTasks: tasks.length,
      totalLists: lists.length,
      totalLabels: labels.length,
      completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
      pendingTasks: tasks.filter((t: any) => t.status !== 'completed').length,
    },
  };
}

function getExportContent(data: any, format: string): string {
  switch (format) {
    case 'json':
      return JSON.stringify(data, null, 2);
    case 'csv':
      return generateCSV(data);
    case 'markdown':
      return generateMarkdown(data);
    case 'ics':
      return generateICS(data);
    default:
      return JSON.stringify(data, null, 2);
  }
}

function getScheduledExports(userId: string): ScheduledExport[] {
  // In production, fetch from database
  return [
    {
      id: '1',
      userId,
      format: 'json',
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1,
      nextRun: getNextRunDate('weekly', 1, '09:00'),
      enabled: true,
    },
  ];
}

function createScheduledExport(config: {
  userId: string;
  format: string;
  frequency: string;
  time: string;
}): ScheduledExport {
  return {
    id: crypto.randomUUID(),
    userId: config.userId,
    format: config.format as any,
    frequency: config.frequency as any,
    time: config.time,
    nextRun: getNextRunDate(config.frequency, 0, config.time),
    enabled: true,
  };
}

function getNextRunDate(frequency: string, dayOfWeek: number | undefined, time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);

  if (frequency === 'weekly' && dayOfWeek !== undefined) {
    date.setDate(date.getDate() + (dayOfWeek - date.getDay() + 7) % 7);
  } else if (frequency === 'monthly') {
    date.setDate(1);
    date.setMonth(date.getMonth() + 1);
  }

  return date.toISOString();
}
