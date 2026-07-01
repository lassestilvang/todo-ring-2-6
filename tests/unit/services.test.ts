/**
 * Services Layer Tests
 */

import { describe, it, expect } from 'vitest';

describe('Services Layer', () => {
  describe('Time Blocking Service', () => {
    it('should have time-blocking-service.ts file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/time-blocking-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Task Batches Service', () => {
    it('should have task-batches-service.ts file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/task-batches-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Focus Sessions Service', () => {
    it('should have focus-sessions-service.ts file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/focus-sessions-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('AI Analytics Service', () => {
    it('should have ai-analytics-service.ts file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/ai-analytics-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});