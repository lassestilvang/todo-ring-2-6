import { describe, it, expect } from 'vitest';
import {
  generateJSON,
  generateMarkdown,
  generateCSV,
  parseImportData,
  generatePrintable,
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
        date: null,
        deadline: '2024-01-20',
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
        date: null,
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
});