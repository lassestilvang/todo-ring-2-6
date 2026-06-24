import { describe, it, expect } from 'vitest';
import {
  generateJSON,
  generateMarkdown,
  generateCSV,
  parseImportData,
  generatePrintable,
  generateICS,
  generatePDF,
} from '../../src/lib/export';

describe('Export Utilities - Comprehensive', () => {
  const mockData = {
    version: '1.0',
    exportedAt: '2024-01-15T10:00:00Z',
    tasks: [
      {
        id: '1',
        title: 'Test Task',
        description: 'Test description',
        listId: 'list-1',
        date: '2024-01-20',
        deadline: '2024-01-25',
        estimateHours: 2,
        estimateMinutes: 30,
        actualHours: 1,
        actualMinutes: 0,
        priority: 'high' as const,
        status: 'pending' as const,
        recurringType: 'none' as const,
        recurringInterval: '',
        isAllDay: false,
        completedAt: null,
        sortOrder: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: '2',
        title: 'Completed Task',
        description: '',
        listId: 'list-1',
        date: '2024-01-18',
        deadline: null,
        estimateHours: 0,
        estimateMinutes: 0,
        actualHours: 0,
        actualMinutes: 0,
        priority: 'none' as const,
        status: 'completed' as const,
        recurringType: 'none' as const,
        recurringInterval: '',
        isAllDay: false,
        completedAt: '2024-01-16T10:00:00Z',
        sortOrder: 1,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
      },
    ],
    lists: [
      {
        id: 'list-1',
        name: 'Test List',
        color: '#3b82f6',
        emoji: '📋',
        isInbox: false,
        sortOrder: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ],
    labels: [],
    metadata: {
      totalTasks: 2,
      totalLists: 1,
      totalLabels: 0,
      completedTasks: 1,
      pendingTasks: 1,
    },
  };

  describe('generateJSON', () => {
    it('should generate valid JSON', () => {
      const result = generateJSON(mockData);
      const parsed = JSON.parse(result);
      expect(parsed.version).toBe('1.0');
      expect(parsed.tasks).toHaveLength(2);
    });

    it('should include all required fields', () => {
      const result = generateJSON(mockData);
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('version');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('tasks');
      expect(parsed).toHaveProperty('lists');
      expect(parsed).toHaveProperty('labels');
      expect(parsed).toHaveProperty('metadata');
    });
  });

  describe('generateMarkdown', () => {
    it('should generate markdown with task title', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('# TaskPlanner Export');
      expect(result).toContain('Test Task');
      expect(result).toContain('Completed Task');
    });

    it('should include statistics', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('2 tasks');
      expect(result).toContain('1 completed');
    });

    it('should include lists and labels sections', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('## 📋 Lists');
      expect(result).toContain('Test List');
      expect(result).toContain('## 🏷️ Labels');
    });

    it('should include pending tasks', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('## ✅ Pending Tasks');
      expect(result).toContain('Test Task');
    });

    it('should include completed tasks', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('## ✔️ Completed Tasks');
      expect(result).toContain('Completed Task');
    });

    it('should include priority emoji', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('🔴'); // high priority
    });
  });

  describe('generateCSV', () => {
    it('should generate CSV with headers', () => {
      const result = generateCSV(mockData);
      expect(result).toContain('ID,Title,Description');
    });

    it('should include task data', () => {
      const result = generateCSV(mockData);
      expect(result).toContain('Test Task');
      expect(result).toContain('Completed Task');
    });

    it('should escape quotes in values', () => {
      const dataWithQuotes = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], title: 'Task "with" quotes' }],
      };
      const result = generateCSV(dataWithQuotes);
      expect(result).toContain('"Task ""with"" quotes"');
    });
  });

  describe('parseImportData', () => {
    it('should parse valid JSON', () => {
      const json = JSON.stringify(mockData);
      const result = parseImportData(json);
      expect(result.version).toBe('1.0');
    });

    it('should throw error for missing version', () => {
      const json = JSON.stringify({ exportedAt: '2024-01-15' });
      expect(() => parseImportData(json)).toThrow('Invalid export file');
    });

    it('should throw error for missing timestamp', () => {
      const json = JSON.stringify({ version: '1.0' });
      expect(() => parseImportData(json)).toThrow('Invalid export file');
    });
  });

  describe('generatePrintable', () => {
    it('should generate HTML with statistics', () => {
      const result = generatePrintable(mockData);
      // generatePrintable returns a data URI, decode it
      const decoded = decodeURIComponent(result.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('TaskPlanner Export');
      expect(decoded).toContain('2'); // total tasks
      expect(decoded).toContain('1'); // completed tasks
    });

    it('should include print script', () => {
      const result = generatePrintable(mockData);
      expect(result).toContain('window.print()');
    });

    it('should include CSS styles', () => {
      const result = generatePrintable(mockData);
      // generatePrintable returns a data URI, decode it
      const decoded = decodeURIComponent(result.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('<style>');
      expect(decoded).toContain('@media print');
    });
  });

  describe('generateCSV edge cases', () => {
    it('should handle tasks without listId', () => {
      const dataWithoutList = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], listId: null }],
      };
      const result = generateCSV(dataWithoutList);
      expect(result).toContain('Test Task');
    });
  });

  describe('generateICS', () => {
    it('should generate valid ICS format', () => {
      const ics = generateICS(mockData);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('BEGIN:VCALENDAR');
      expect(decoded).toContain('END:VCALENDAR');
      expect(decoded).toContain('VERSION:2.0');
    });

    it('should include tasks with dates', () => {
      const ics = generateICS(mockData);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('BEGIN:VEVENT');
      expect(decoded).toContain('END:VEVENT');
      expect(decoded).toContain('Test Task');
    });

    it('should skip tasks without dates', () => {
      const dataWithoutDate = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], date: null }],
      };
      const ics = generateICS(dataWithoutDate);
      expect(ics).toContain('data:text/calendar;charset=utf-8');
    });

    it('should include deadline as DUE date', () => {
      const ics = generateICS(mockData);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('DUE:');
    });

    it('should include priority mapping', () => {
      const ics = generateICS(mockData);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('PRIORITY:');
    });

    it('should map high priority to 1', () => {
      const highPriorityTask = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], priority: 'high' as const, date: '2024-01-20' }],
      };
      const ics = generateICS(highPriorityTask);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('PRIORITY:1');
    });

    it('should map low priority to 9', () => {
      const lowPriorityTask = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], priority: 'low' as const, date: '2024-01-20' }],
      };
      const ics = generateICS(lowPriorityTask);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('PRIORITY:9');
    });

    it('should map medium priority to 5', () => {
      const mediumPriorityTask = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], priority: 'medium' as const, date: '2024-01-20' }],
      };
      const ics = generateICS(mediumPriorityTask);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('PRIORITY:5');
    });

    it('should mark completed tasks as COMPLETED', () => {
      const dataWithCompletedDate = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], status: 'completed' as const, date: '2024-01-20' }],
      };
      const ics = generateICS(dataWithCompletedDate);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('STATUS:COMPLETED');
    });

    it('should mark pending tasks as NEEDS-ACTION', () => {
      const ics = generateICS(mockData);
      const decoded = decodeURIComponent(ics);
      expect(decoded).toContain('STATUS:NEEDS-ACTION');
    });

    it('should encode special characters in title', () => {
      const dataWithSpecialChars = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], title: 'Task with\nnewline', date: '2024-01-20' }],
      };
      const ics = generateICS(dataWithSpecialChars);
      expect(ics).toBeDefined();
    });

    it('should return data URI', () => {
      const ics = generateICS(mockData);
      expect(ics).toContain('data:text/calendar;charset=utf-8');
    });
  });

  describe('generatePDF', () => {
    it('should generate valid HTML PDF format', () => {
      const pdf = generatePDF(mockData);
      expect(pdf).toContain('data:text/html;charset=utf-8');
    });

    it('should include statistics', () => {
      const pdf = generatePDF(mockData);
      const decoded = decodeURIComponent(pdf.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('Total Tasks');
      expect(decoded).toContain('Completed');
    });

    it('should include tasks table', () => {
      const pdf = generatePDF(mockData);
      const decoded = decodeURIComponent(pdf.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('<table>');
      expect(decoded).toContain('</table>');
      expect(decoded).toContain('Test Task');
    });

    it('should include task details in table', () => {
      const pdf = generatePDF(mockData);
      const decoded = decodeURIComponent(pdf.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('Title');
      expect(decoded).toContain('Priority');
      expect(decoded).toContain('Status');
    });

    it('should include estimate hours', () => {
      const pdf = generatePDF(mockData);
      const decoded = decodeURIComponent(pdf.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('Estimate');
    });

    it('should handle completed task styling', () => {
      const pdf = generatePDF(mockData);
      const decoded = decodeURIComponent(pdf.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('completed');
    });

    it('should include print script', () => {
      const pdf = generatePDF(mockData);
      const decoded = decodeURIComponent(pdf.replace('data:text/html;charset=utf-8,', ''));
      expect(decoded).toContain('window.print()');
    });

    it('should handle empty tasks array', () => {
      const emptyData = {
        ...mockData,
        tasks: [],
      };
      const pdf = generatePDF(emptyData);
      expect(pdf).toBeDefined();
    });

    it('should handle tasks without listId', () => {
      const dataWithoutList = {
        ...mockData,
        lists: [],
        tasks: [{ ...mockData.tasks[0], listId: null }],
      };
      const pdf = generatePDF(dataWithoutList);
      expect(pdf).toBeDefined();
    });

    it('should handle tasks with null date', () => {
      const dataWithNullDate = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], date: null }],
      };
      const pdf = generatePDF(dataWithNullDate);
      const decoded = decodeURIComponent(pdf);
      expect(decoded).toContain('-');
    });
  });
});