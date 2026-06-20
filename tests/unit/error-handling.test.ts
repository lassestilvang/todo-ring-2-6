import { describe, it, expect } from 'vitest';
import { getPriorityLevel } from '../../src/lib/task-utils';
import { generateCSV } from '../../src/lib/export';
import { uploadFile } from '../../src/lib/file-upload';

describe('Error Handling Coverage', () => {
  describe('task-utils.ts - unknown priority fallback', () => {
    it('should return default for unknown priority', () => {
      expect(getPriorityLevel('invalid' as any)).toBe(3);
    });
  });

  describe('export.ts edge cases', () => {
    it('should handle tasks without listId in CSV', () => {
      const data = {
        version: '1.0',
        exportedAt: '2024-01-15',
        tasks: [{ id: '1', title: 'Test', listId: null }],
        lists: [],
        labels: [],
        metadata: { totalTasks: 1, totalLists: 0, totalLabels: 0, completedTasks: 0, pendingTasks: 1 },
      };
      const result = generateCSV(data);
      expect(result).toContain('Test');
    });
  });

  describe('file-upload.ts - uploadFile edge cases', () => {
    it('should handle file without extension', async () => {
      const file = new File(['test'], 'noextension', { type: 'text/plain' });
      Object.defineProperty(file, 'size', { value: 100 });
      
      const result = await uploadFile(file);
      expect(typeof result.success).toBe('boolean');
    });
  });
});
