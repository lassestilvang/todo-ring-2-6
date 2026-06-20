import { describe, it, expect } from 'vitest';
import { generateJSON, generateMarkdown, generateCSV, generatePrintable, parseImportData } from '../../src/lib/export';

describe('Export Utilities', () => {
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
      totalTasks: 1,
      totalLists: 1,
      totalLabels: 0,
      completedTasks: 0,
      pendingTasks: 1,
    },
  };

  const mockDataWithLabels = {
    ...mockData,
    labels: [
      {
        id: 'label-1',
        name: 'Important',
        color: '#ef4444',
        icon: '🔴',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ],
  };

  const mockDataWithCompleted = {
    ...mockData,
    tasks: [
      {
        ...mockData.tasks[0],
        status: 'completed' as const,
        completedAt: '2024-01-16T10:00:00Z',
      },
    ],
    metadata: {
      totalTasks: 1,
      totalLists: 1,
      totalLabels: 0,
      completedTasks: 1,
      pendingTasks: 0,
    },
  };

  const mockDataWithDate = {
    ...mockData,
    tasks: [
      {
        ...mockData.tasks[0],
        date: '2024-01-25',
      },
    ],
  };

  const mockDataWithDescription = {
    ...mockData,
    tasks: [
      {
        ...mockData.tasks[0],
        description: 'Test description for markdown',
      },
    ],
  };

  const mockDataWithDeadline = {
    ...mockData,
    tasks: [
      {
        ...mockData.tasks[0],
        deadline: '2024-02-01',
      },
    ],
  };

  const mockDataWithCompletedAt = {
    ...mockData,
    tasks: [
      {
        ...mockData.tasks[0],
        status: 'completed' as const,
        completedAt: '2024-01-16T10:00:00Z',
      },
    ],
    metadata: {
      totalTasks: 1,
      totalLists: 1,
      totalLabels: 0,
      completedTasks: 1,
      pendingTasks: 0,
    },
  };

  const mockDataWithListId = {
    ...mockData,
    lists: [
      {
        id: 'list-1',
        name: 'My List',
        color: '#3b82f6',
        emoji: '📋',
        isInbox: false,
        sortOrder: 0,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ],
    tasks: [
      {
        ...mockData.tasks[0],
        listId: 'list-1',
      },
    ],
  };

  describe('generateJSON', () => {
    it('should generate valid JSON', () => {
      const result = generateJSON(mockData);
      const parsed = JSON.parse(result);
      expect(parsed.version).toBe('1.0');
      expect(parsed.tasks).toHaveLength(1);
    });
  });

  describe('generateMarkdown', () => {
    it('should generate markdown with task title', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('# TaskPlanner Export');
      expect(result).toContain('Test Task');
    });

    it('should include labels section', () => {
      const result = generateMarkdown(mockDataWithLabels);
      expect(result).toContain('## 📋 Lists');
      expect(result).toContain('## 🏷️ Labels');
      expect(result).toContain('Important');
    });

    it('should include completed tasks section', () => {
      const result = generateMarkdown(mockDataWithCompleted);
      expect(result).toContain('## ✔️ Completed Tasks');
    });

    it('should include pending tasks section', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('## ✅ Pending Tasks');
    });

    it('should format deadline correctly', () => {
      const result = generateMarkdown(mockData);
      expect(result).toContain('Due:');
    });

    it('should include task date in markdown', () => {
      const result = generateMarkdown(mockDataWithDate);
      expect(result).toContain('📅');
    });

    it('should include task description in markdown', () => {
      const result = generateMarkdown(mockDataWithDescription);
      expect(result).toContain('Test description for markdown');
    });

    it('should include deadline in markdown', () => {
      const result = generateMarkdown(mockDataWithDeadline);
      expect(result).toContain('Due:');
    });

    it('should include completedAt date in completed tasks', () => {
      const result = generateMarkdown(mockDataWithCompletedAt);
      expect(result).toContain('Completed:');
    });

    it('should not include description when not present', () => {
      const dataWithoutDescription = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], description: null }],
      };
      const result = generateMarkdown(dataWithoutDescription);
      // Should still generate valid markdown
      expect(result).toContain('Test Task');
    });

    it('should not include date when not present', () => {
      const dataWithoutDate = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], date: null }],
      };
      const result = generateMarkdown(dataWithoutDate);
      expect(result).not.toContain('📅');
    });

    it('should not include deadline when not present', () => {
      const dataWithoutDeadline = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], deadline: null }],
      };
      const result = generateMarkdown(dataWithoutDeadline);
      expect(result).not.toContain('Due:');
    });

    it('should not include completedAt when not present', () => {
      const dataWithoutCompletedAt = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], status: 'completed' as const, completedAt: null }],
        metadata: { ...mockData.metadata, completedTasks: 1, pendingTasks: 0 },
      };
      const result = generateMarkdown(dataWithoutCompletedAt);
      expect(result).not.toContain('Completed:');
    });

    it('should handle task with listId not in lists array', () => {
      const dataWithOrphanList = {
        ...mockData,
        lists: [],
        tasks: [{ ...mockData.tasks[0], listId: 'non-existent-list' }],
      };
      const result = generateCSV(dataWithOrphanList);
      // Should not throw, should use empty string for list name
      expect(result).toBeDefined();
    });
  });

  describe('generateCSV', () => {
    it('should generate CSV with headers', () => {
      const result = generateCSV(mockData);
      expect(result).toContain('ID,Title,Description');
      expect(result).toContain('Test Task');
    });

    it('should include list name in CSV', () => {
      const result = generateCSV(mockDataWithListId);
      expect(result).toContain('My List');
    });

    it('should escape quoted values', () => {
      const dataWithQuotes = {
        ...mockData,
        tasks: [{ ...mockData.tasks[0], title: 'Task with "quotes"' }],
      };
      const result = generateCSV(dataWithQuotes);
      expect(result).toContain('"Task with ""quotes"""');
    });
  });

  describe('generatePrintable', () => {
    it('should generate printable HTML', () => {
      const result = generatePrintable(mockData);
      expect(result).toContain('data:text/html;charset=utf-8');
      // The content is URL encoded, so check for the encoded version
      expect(result).toContain('TaskPlanner%20Export');
    });
  });

  describe('parseImportData', () => {
    it('should parse valid import data', () => {
      const json = JSON.stringify(mockData);
      const result = parseImportData(json);
      expect(result.version).toBe('1.0');
    });

    it('should throw error for missing version', () => {
      const invalidData = { exportedAt: '2024-01-15T10:00:00Z' };
      expect(() => parseImportData(JSON.stringify(invalidData))).toThrow('Invalid export file');
    });

    it('should throw error for missing exportedAt', () => {
      const invalidData = { version: '1.0' };
      expect(() => parseImportData(JSON.stringify(invalidData))).toThrow('Invalid export file');
    });
  });
});