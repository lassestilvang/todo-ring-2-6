import { describe, it, expect } from 'vitest';
import { generateCSV, generateJSON, parseImportData } from '../../src/lib/export';

describe('Export Edge Cases', () => {
  const mockData = {
    version: '1.0',
    exportedAt: '2024-01-15T10:00:00Z',
    tasks: [],
    lists: [],
    labels: [],
    metadata: {
      totalTasks: 0,
      totalLists: 0,
      totalLabels: 0,
      completedTasks: 0,
      pendingTasks: 0,
    },
  };

  describe('generateCSV', () => {
    it('should handle tasks without listId', () => {
      const data = {
        ...mockData,
        tasks: [{ id: '1', title: 'Test', listId: null }],
      };
      const result = generateCSV(data);
      expect(result).toContain('Test');
    });

    it('should handle empty tasks array', () => {
      const result = generateCSV(mockData);
      expect(result).toContain('ID,Title');
    });
  });

  describe('parseImportData', () => {
    it('should throw for invalid JSON', () => {
      expect(() => parseImportData('not json')).toThrow();
    });
  });
});
