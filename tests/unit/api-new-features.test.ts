/**
 * New API Features Tests
 */

import { describe, it, expect } from 'vitest';

describe('New API Features', () => {
  describe('API Files Exist', () => {
    it('should have health route file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/app/api/health/route.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have cache route file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/app/api/cache/route.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have focus-sessions route file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/app/api/focus-sessions/route.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have task-batches route file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/app/api/task-batches/route.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have time-blocking route file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/app/api/time-blocking/route.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have ai analytics route file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/app/api/analytics/ai/route.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Service Files Exist', () => {
    it('should have time-blocking-service file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/time-blocking-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have task-batches-service file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/task-batches-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have focus-sessions-service file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/focus-sessions-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have ai-analytics-service file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/services/ai-analytics-service.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('Utility Files Exist', () => {
    it('should have api-versioning file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/lib/api-versioning.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have api-wrapper file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/lib/api-wrapper.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should have logger file', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(__dirname, '../../src/lib/logger.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });
});