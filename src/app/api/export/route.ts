import { NextRequest, NextResponse } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { getAllTasks, getAllLists, getAllLabels } from '@/db/operations';
import { generateMarkdown, generateCSV, generatePrintable, generateICS, parseImportData } from '@/lib/export';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import type { Task, List, Label } from '@/types/index';

// Generate PDF buffer - uses Puppeteer if available, falls back to HTML
async function generatePDFBuffer(data: ExportData): Promise<Buffer> {
  try {
    // Try to use Puppeteer for proper PDF generation
    const puppeteer = (await import('puppeteer')).default;
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const htmlContent = generatePDFHTML(data);
    await page.setContent(htmlContent, { waitUntil: 'load' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch {
    // Fallback: return HTML as PDF-like response
    const htmlContent = generatePDFHTML(data);
    return Buffer.from(htmlContent);
  }
}

function generatePDFHTML(data: ExportData): string {
  const content = generateMarkdown(data);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>TaskPlanner Export</title>
    <style>
      @media screen { body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; } }
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
    ${content}
  </body>
</html>`;
}

ensureDbInitialized();

type ExportData = {
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
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const tasks = getAllTasks();
    const lists = getAllLists();
    const labels = getAllLabels();

    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks,
      lists,
      labels,
      metadata: {
        totalTasks: tasks.length,
        totalLists: lists.length,
        totalLabels: labels.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        pendingTasks: tasks.filter(t => t.status !== 'completed').length,
      },
    };

    if (format === 'markdown') {
      const mdContent = generateMarkdown(exportData);
      return new NextResponse(mdContent, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.md"`,
        },
      });
    }

    if (format === 'csv') {
      const csvContent = generateCSV(exportData);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (format === 'printable') {
      const printableUrl = generatePrintable(exportData);
      return new NextResponse(printableUrl, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.html"`,
        },
      });
    }

    if (format === 'ics') {
      const icsContent = generateICS(exportData);
      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.ics"`,
        },
      });
    }

    if (format === 'pdf') {
      // Generate PDF using Puppeteer (server-side)
      // Falls back to HTML if Puppeteer is not available
      const pdfBuffer = await generatePDFBuffer(exportData);
      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="tasks-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

    // Default: JSON
    return jsonSuccess(exportData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to export data';
    return jsonError(message, 500, 'EXPORT_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { json } = body;

    if (!json) {
      return jsonError('JSON data is required', 400, 'MISSING_DATA');
    }

    const importData = parseImportData(json);

    return jsonSuccess({
      message: 'Import validated successfully',
      version: importData.version,
      tasks: importData.tasks.length,
      lists: importData.lists.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to validate import';
    return jsonError(message, 400, 'IMPORT_ERROR');
  }
}