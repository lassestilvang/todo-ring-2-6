/**
 * Export utilities for tasks
 */

import type { Task, List, Label } from '@/types/index';

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'ics' | 'pdf';

interface ExportData {
  version: string;
  exportedAt: string;
  tasks: Task[];
  lists: List[];
  labels: Label[];
  metadata: {
    totalTasks: number;
    totalLists: number;
    totalLabels: number;
    completedTasks: number;
    pendingTasks: number;
  };
}

/**
 * Generate Markdown export
 */
export function generateMarkdown(data: ExportData): string {
  const { tasks, lists, labels } = data;
  let md = `# TaskPlanner Export\n\n`;
  md += `**Exported:** ${new Date(data.exportedAt).toLocaleString()}\n\n`;
  md += `**Statistics:** ${data.metadata.totalTasks} tasks, ${data.metadata.completedTasks} completed\n\n`;
  md += `---\n\n`;

  // Lists
  md += `## 📋 Lists\n\n`;
  lists.forEach(list => {
    md += `### ${list.emoji} ${list.name}\n`;
  });
  md += `\n`;

  // Labels
  md += `## 🏷️ Labels\n\n`;
  labels.forEach(label => {
    md += `- ${label.icon} **${label.name}** \`#${label.color}\`\n`;
  });
  md += `\n`;

  // Tasks by status
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (pendingTasks.length > 0) {
    md += `## ✅ Pending Tasks\n\n`;
    pendingTasks.forEach(task => {
      const priorityEmoji = {
        high: '🔴',
        medium: '🟡',
        low: '🟢',
        none: '⚪',
      }[task.priority];

      md += `- [ ] ${priorityEmoji} **${task.title}**\n`;

      if (task.description) {
        md += `  - ${task.description}\n`;
      }

      if (task.date) {
        md += `  - 📅 ${new Date(task.date).toLocaleDateString()}\n`;
      }

      if (task.deadline) {
        md += `  - ⏰ Due: ${new Date(task.deadline).toLocaleDateString()}\n`;
      }
    });
    md += `\n`;
  }

  if (completedTasks.length > 0) {
    md += `## ✔️ Completed Tasks\n\n`;
    completedTasks.forEach(task => {
      md += `- [x] **${task.title}**\n`;
      if (task.completedAt) {
        md += `  - Completed: ${new Date(task.completedAt).toLocaleDateString()}\n`;
      }
    });
    md += `\n`;
  }

  return md;
}

/**
 * Generate CSV export
 */
export function generateCSV(data: ExportData): string {
  const headers = ['ID', 'Title', 'Description', 'List', 'Date', 'Deadline', 'Priority', 'Status', 'Estimate (h)', 'Actual (h)'];
  const rows = [headers.join(',')];

  data.tasks.forEach(task => {
    const row = [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      `"${(task.description || '').replace(/"/g, '""')}"`,
      `"${(task.listId ? data.lists.find(l => l.id === task.listId)?.name || '' : '').replace(/"/g, '""')}"`,
      task.date || '',
      task.deadline || '',
      task.priority,
      task.status,
      `${task.estimateHours || 0}`,
      `${task.actualHours || 0}`,
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Generate JSON export
 */
export function generateJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Parse imported JSON data
 */
export function parseImportData(json: string): ExportData {
  const data = JSON.parse(json);

  // Validate required fields
  if (!data.version || !data.exportedAt) {
    throw new Error('Invalid export file: missing version or timestamp');
  }

  return data;
}

/**
 * Generate printable export
 */
export function generatePrintable(data: ExportData): string {
  const content = generateMarkdown(data);
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TaskPlanner Export</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; }
          h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; }
          h3 { color: #475569; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat { background: #f8fafc; padding: 15px 20px; border-radius: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          .task { padding: 10px; margin: 6px 0; border-radius: 6px; border-left: 3px solid #cbd5e1; background: #f8fafc; }
          .completed { opacity: 0.6; text-decoration: line-through; }
          .high { border-left-color: #ef4444; }
          .medium { border-left-color: #f59e0b; }
          .low { border-left-color: #3b82f6; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📋 TaskPlanner Export</h1>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${data.metadata.totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.metadata.completedTasks}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat">
            <div class="stat-value">${Math.round((data.metadata.completedTasks / Math.max(data.metadata.totalTasks, 1)) * 100)}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
        <hr />
        ${content}
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `)}`;
}

/**
 * Generate iCal (.ics) export for calendar integration
 */
export function generateICS(data: ExportData): string {
  const now = new Date();
  const uid = `taskplanner-${now.getTime()}@taskplanner.app`;

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskPlanner//TaskPlanner//EN',
    'CALNAME:TaskPlanner Tasks',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    'TZID:UTC',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0000',
    'TZOFFSETTO:+0000',
    'END:STANDARD',
    'END:VTIMEZONE',
  ].join('\r\n');

  data.tasks.forEach(task => {
    if (!task.date) return;

    const taskDate = new Date(task.date);
    const dueDate = task.deadline ? new Date(task.deadline) : null;
    const uid = `task-${task.id}@taskplanner.app`;
    const dtstamp = now.toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z';
    const dtstart = taskDate.toISOString().replace(/[-:T]/g, '').split('.')[0] + 'Z';

    ics += [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `SUMMARY:${task.title.replace(/\n/g, '\\n')}`,
      task.description && `DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`,
      task.deadline && `DUE:${dueDate?.toISOString().replace(/[-:T]/g, '').split('.')[0]}Z`,
      `STATUS:${task.status === 'completed' ? 'COMPLETED' : 'NEEDS-ACTION'}`,
      `PRIORITY:${task.priority === 'high' ? 1 : task.priority === 'medium' ? 5 : 9}`,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });

  ics += '\r\nEND:VCALENDAR';

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

/**
 * Generate PDF export URL (opens print dialog)
 */
export function generatePDF(data: ExportData): string {
  const content = generateMarkdown(data);
  return `data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>TaskPlanner Export</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          @media screen { body { font-family: system-ui; max-width: 900px; margin: 0 auto; padding: 20px; } }
          @media print {
            body { padding: 0; margin: 0; }
            .no-print { display: none; }
            h1 { page-break-before: always; }
          }
          h1 { color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px; }
          .stats { display: flex; gap: 20px; margin: 20px 0; }
          .stat { background: #f8fafc; padding: 15px 20px; border-radius: 8px; flex: 1; }
          .stat-value { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: 600; }
          .completed { opacity: 0.6; }
        </style>
      </head>
      <body>
        <h1>📋 TaskPlanner Export</h1>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${data.metadata.totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          <div class="stat">
            <div class="stat-value">${data.metadata.completedTasks}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat">
            <div class="stat-value">${Math.round((data.metadata.completedTasks / Math.max(data.metadata.totalTasks, 1)) * 100)}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
        <hr />
        <h2>📝 Tasks</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Deadline</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Estimate</th>
            </tr>
          </thead>
          <tbody>
            ${data.tasks.map(t => `
              <tr class="${t.status === 'completed' ? 'completed' : ''}">
                <td>${t.title}</td>
                <td>${t.date || '-'}</td>
                <td>${t.deadline || '-'}</td>
                <td>${t.priority}</td>
                <td>${t.status}</td>
                <td>${t.estimateHours || 0}h ${t.estimateMinutes || 0}m</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `)}`;
}