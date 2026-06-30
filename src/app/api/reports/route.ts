/**
 * Reports API Route
 * Generates and exports reports in various formats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db-client';
import { z } from 'zod';

const reportSchema = z.object({
  type: z.enum(['productivity', 'time-tracking', 'task-completion', 'overview']),
  format: z.enum(['json', 'pdf', 'csv']).default('json'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  userId: z.string(),
});

// GET - Generate report
async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type') || 'overview';
  const format = searchParams.get('format') || 'json';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const userId = req.headers.get('x-user-id');

  const db = getDb();

  let data: any;

  switch (type) {
    case 'productivity':
      data = await generateProductivityReport(db, userId, startDate, endDate);
      break;
    case 'time-tracking':
      data = await generateTimeTrackingReport(db, userId, startDate, endDate);
      break;
    case 'task-completion':
      data = await generateTaskCompletionReport(db, userId, startDate, endDate);
      break;
    default:
      data = await generateOverviewReport(db, userId, startDate, endDate);
  }

  if (format === 'pdf') {
    // Return HTML that can be printed to PDF
    return new NextResponse(generatePDFHtml(data, type), {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (format === 'csv') {
    return new NextResponse(generateCSV(data), {
      headers: { 'Content-Type': 'text/csv' },
    });
  }

  return NextResponse.json({ success: true, data });
}

async function generateOverviewReport(db: Database.Database, userId: string | null, startDate: string | null, endDate: string | null) {
  const whereClause = userId ? 'WHERE user_id = ?' : '';
  const dateFilter = startDate && endDate ? 'AND created_at BETWEEN ? AND ?' : '';

  const tasksResult = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM tasks
    ${whereClause}
    ${dateFilter}
    GROUP BY status
  `).all(userId, startDate, endDate);

  const listsResult = db.prepare(`
    SELECT COUNT(*) as count FROM lists ${whereClause}
  `).get(userId);

  const labelsResult = db.prepare(`
    SELECT COUNT(*) as count FROM labels
  `).get();

  return {
    summary: {
      totalTasks: tasksResult.reduce((sum: number, r: any) => sum + r.count, 0),
      totalLists: listsResult.count,
      totalLabels: labelsResult.count,
    },
    statusDistribution: tasksResult,
  };
}

async function generateProductivityReport(db: Database.Database, userId: string | null, startDate: string | null, endDate: string | null) {
  const tasks = db.prepare(`
    SELECT t.*, l.name as list_name
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE (? IS NULL OR t.user_id = ?)
    AND (? IS NULL OR t.created_at >= ?)
    AND (? IS NULL OR t.created_at <= ?)
    ORDER BY t.created_at DESC
  `).all(userId, userId, startDate, startDate, endDate, endDate);

  return {
    period: { startDate, endDate },
    totalTasks: tasks.length,
    tasks,
  };
}

async function generateTimeTrackingReport(db: Database.Database, userId: string | null, startDate: string | null, endDate: string | null) {
  const timeEntries = db.prepare(`
    SELECT te.*, t.title as task_title
    FROM time_entries te
    LEFT JOIN tasks t ON te.task_id = t.id
    WHERE (? IS NULL OR te.user_id = ?)
    AND (? IS NULL OR te.start_time >= ?)
    AND (? IS NULL OR te.end_time <= ?)
    ORDER BY te.start_time DESC
  `).all(userId, userId, startDate, startDate, endDate, endDate);

  const totalMinutes = timeEntries.reduce((sum: number, entry: any) => sum + entry.duration, 0);

  return {
    period: { startDate, endDate },
    totalHours: Math.round(totalMinutes / 60 * 100) / 100,
    totalEntries: timeEntries.length,
    entries: timeEntries,
  };
}

async function generateTaskCompletionReport(db: Database.Database, userId: string | null, startDate: string | null, endDate: string | null) {
  const completedTasks = db.prepare(`
    SELECT t.*, l.name as list_name,
           CAST(julianday(completed_at) - julianday(created_at) AS INTEGER) as days_to_complete
    FROM tasks t
    LEFT JOIN lists l ON t.list_id = l.id
    WHERE t.status = 'completed'
    AND (? IS NULL OR t.user_id = ?)
    AND (? IS NULL OR t.created_at >= ?)
    AND (? IS NULL OR t.completed_at <= ?)
    ORDER BY t.completed_at DESC
  `).all(userId, userId, startDate, startDate, endDate, endDate);

  const avgCompletionTime = completedTasks.reduce((sum: number, t: any) => sum + (t.days_to_complete || 0), 0) / completedTasks.length;

  return {
    period: { startDate, endDate },
    totalCompleted: completedTasks.length,
    avgDaysToComplete: Math.round(avgCompletionTime * 100) / 100,
    completedTasks,
  };
}

function generatePDFHtml(data: any, type: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${type} Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #1a1a1a; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
        .stat { background: #f8f9fa; padding: 16px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
        .stat-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e9ecef; }
        th { background: #f8f9fa; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${type.charAt(0).toUpperCase() + type.slice(1)} Report</h1>
        ${JSON.stringify(data)}
      </div>
    </body>
    </html>
  `
}

function generateCSV(data: any): string {
  const headers = Object.keys(data).join(',');
  const rows = Object.values(data).map(v => String(v)).join(',');
  return `${headers}\n${rows}`;
}

export { GET };