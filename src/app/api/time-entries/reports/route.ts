import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getDb } from '@/db/db-client';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';

ensureDbInitialized();

interface TimeEntryReport {
  date: string;
  total_minutes: number;
  entry_count: number;
}

// GET /api/time-entries/reports?period=week|month
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || 'week';
    const taskId = searchParams.get('taskId');

    const db = getDb();
    const now = new Date();
    let startDate = new Date();

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = now.toISOString().split('T')[0];

    let query = `
      SELECT
        DATE(start_time) as date,
        SUM(duration) as total_minutes,
        COUNT(*) as entry_count
      FROM time_entries
      WHERE start_time >= ? AND start_time <= ?
    `;
    const params: any[] = [startStr, endStr];

    if (taskId) {
      query += ' AND task_id = ?';
      params.push(taskId);
    }

    query += ' GROUP BY DATE(start_time) ORDER BY date DESC';

    const reports = db.prepare(query).all(...params) as TimeEntryReport[];

    const totalMinutes = reports.reduce((sum, r) => sum + r.total_minutes, 0);
    const totalEntries = reports.reduce((sum, r) => sum + r.entry_count, 0);

    return jsonSuccess({
      period,
      totalMinutes,
      totalEntries,
      dailyReports: reports,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch time reports';
    return jsonError(message, 500, ErrorCodes.INTERNAL_ERROR);
  }
}