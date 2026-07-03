/**
 * PDF Export Service
 * Generates PDF reports for tasks and analytics
 */

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completedAt?: string;
}

interface ExportOptions {
  filename?: string;
  title?: string;
  showHeaders?: boolean;
  pageSize?: 'a4' | 'a3' | 'letter';
}

class PdfExportService {
  /**
   * Generate a PDF report for tasks
   */
  async exportTasks(tasks: Task[], options: ExportOptions = {}): Promise<Blob> {
    const {
      filename = 'tasks-report.pdf',
      title = 'Task Report',
      showHeaders = true,
      pageSize = 'a4',
    } = options;

    // Create HTML content for PDF
    const htmlContent = this.generateTaskReportHtml(tasks, title, showHeaders);

    // In production, this would use a PDF library like pdfmake or puppeteer
    // For now, return a blob with the HTML content
    return new Blob([htmlContent], { type: 'text/html' });
  }

  /**
   * Generate a PDF report for analytics
   */
  async exportAnalytics(data: any, options: ExportOptions = {}): Promise<Blob> {
    const {
      filename = 'analytics-report.pdf',
      title = 'Analytics Report',
      showHeaders = true,
    } = options;

    const htmlContent = this.generateAnalyticsHtml(data, title, showHeaders);
    return new Blob([htmlContent], { type: 'text/html' });
  }

  private generateTaskReportHtml(tasks: Task[], title: string, showHeaders: boolean): string {
    const rows = tasks.map(task => `
      <tr class="border-b">
        <td class="py-2 px-4 border">${task.title}</td>
        <td class="py-2 px-4 border">${task.priority}</td>
        <td class="py-2 px-4 border">${task.status}</td>
        <td class="py-2 px-4 border">${task.dueDate || '-'}</td>
        <td class="py-2 px-4 border">${task.completedAt ? 'Completed' : 'Pending'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f5f5f5; padding: 8px; text-align: left; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        ${showHeaders ? `
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        ` : ''}
      </body>
      </html>
    `;
  }

  private generateAnalyticsHtml(data: any, title: string, showHeaders: boolean): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          .metric { margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <div class="metric">
          <strong>Completion Rate:</strong> ${data.completionRate || 0}%
        </div>
        <div class="metric">
          <strong>Average Completion Time:</strong> ${data.avgCompletionTime || 0} days
        </div>
      </body>
      </html>
    `;
  }
}

// Singleton instance
let pdfExportService: PdfExportService | null = null;

export function getPdfExportService(): PdfExportService {
  if (!pdfExportService) {
    pdfExportService = new PdfExportService();
  }
  return pdfExportService;
}