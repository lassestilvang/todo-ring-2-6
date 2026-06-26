import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getTasks, getTaskStats, getOverdueCount } from '@/db/operations';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { format } from 'date-fns';
import type { Task } from '@/types/index';

// Ensure database is initialized
ensureDbInitialized();

export async function GET(_req: NextRequest) {
  try {
    const { searchParams } = new URL(_req.url);
    const format_ = searchParams.get('format') || 'json';

    const tasks = getTasks() as Task[];
    const stats = getTaskStats();
    const overdueCount = getOverdueCount();

    const data = {
      summary: {
        total: stats.total,
        completed: stats.completed,
        pending: stats.pending,
        inProgress: stats.inProgress,
        overdue: overdueCount,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
        generatedAt: new Date().toISOString(),
      },
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        status: t.status,
        priority: t.priority,
        listId: t.listId ?? undefined,
        date: t.date ?? undefined,
        deadline: t.deadline ?? undefined,
        createdAt: t.createdAt ?? undefined,
        completedAt: t.completedAt ?? undefined,
        estimateHours: t.estimateHours ?? 0,
        estimateMinutes: t.estimateMinutes ?? 0,
        actualHours: t.actualHours ?? 0,
        actualMinutes: t.actualMinutes ?? 0,
      } as Task)),
    };

    if (format_ === 'csv') {
      const csv = generateCSV(tasks);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="taskplanner-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
        },
      });
    }

    if (format_ === 'markdown') {
      const md = generateMarkdown(data);
      return new Response(md, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="taskplanner-analytics-${format(new Date(), 'yyyy-MM-dd')}.md"`,
        },
      });
    }

    if (format_ === 'printable') {
      const printable = generatePrintableHTML(data);
      return new Response(printable, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="taskplanner-analytics-${format(new Date(), 'yyyy-MM-dd')}.html"`,
        },
      });
    }

    return jsonSuccess(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export analytics';
    return jsonError(message, 500, 'EXPORT_ERROR');
  }
}

function generateCSV(tasks: Task[]): string {
  const headers = ['ID', 'Title', 'Description', 'Status', 'Priority', 'List ID', 'Date', 'Deadline', 'Created At', 'Completed At'];
  const rows = tasks.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.status,
    t.priority,
    t.listId || '',
    t.date || '',
    t.deadline || '',
    t.createdAt || '',
    t.completedAt || '',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateMarkdown(data: { summary: any; tasks: Task[] }): string {
  return `# TaskPlanner Analytics Report

Generated: ${data.summary.generatedAt}

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | ${data.summary.total} |
| Completed | ${data.summary.completed} |
| Pending | ${data.summary.pending} |
| In Progress | ${data.summary.inProgress} |
| Overdue | ${data.summary.overdue} |
| Completion Rate | ${data.summary.completionRate}% |

## Tasks

${data.tasks.map((t: Task) => `### ${t.title}

- **Status**: ${t.status}
- **Priority**: ${t.priority}
- **Date**: ${t.date || 'N/A'}
- **Deadline**: ${t.deadline || 'N/A'}
- **Created**: ${t.createdAt}
- **Completed**: ${t.completedAt || 'N/A'}

`).join('\n')}
`;
}

function generatePrintableHTML(data: { summary: any; tasks: Task[] }): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>TaskPlanner Analytics Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f8f9fa; }
    .completion { color: #10b981; }
    .pending { color: #f59e0b; }
    .overdue { color: #ef4444; }
  </style>
</head>
<body>
  <h1>TaskPlanner Analytics Report</h1>
  <p>Generated: ${data.summary.generatedAt}</p>

  <h2>Summary</h2>
  <table>
    <tr><th>Metric</th><th>Value</th></tr>
    <tr><td>Total Tasks</td><td>${data.summary.total}</td></tr>
    <tr><td>Completed</td><td class="completion">${data.summary.completed}</td></tr>
    <tr><td>Pending</td><td class="pending">${data.summary.pending}</td></tr>
    <tr><td>In Progress</td><td>${data.summary.inProgress}</td></tr>
    <tr><td>Overdue</td><td class="overdue">${data.summary.overdue}</td></tr>
    <tr><td>Completion Rate</td><td>${data.summary.completionRate}%</td></tr>
  </table>

  <h2>Tasks</h2>
  <table>
    <tr><th>Title</th><th>Status</th><th>Priority</th><th>Date</th><th>Deadline</th></tr>
    ${data.tasks.map((t: Task) => `<tr><td>${t.title}</td><td>${t.status}</td><td>${t.priority}</td><td>${t.date || 'N/A'}</td><td>${t.deadline || 'N/A'}</td></tr>`).join('')}
  </table>
</body>
</html>`;
}