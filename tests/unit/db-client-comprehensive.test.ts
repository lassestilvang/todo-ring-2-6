/**
 * Database Client - Comprehensive Tests
 *
 * Tests the database client module with mocked SQLite.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Database Client - Comprehensive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.TEST_MODE = 'true';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.TEST_MODE;
  });

  describe('Module Exports', () => {
    it('should export getDb function', async () => {
      const module = await import('../../db/db-client');
      expect(typeof module.getDb).toBe('function');
    });

    it('should export initDb function', async () => {
      const module = await import('../../db/db-client');
      expect(typeof module.initDb).toBe('function');
    });

    it('should export closeDb function', async () => {
      const module = await import('../../db/db-client');
      expect(typeof module.closeDb).toBe('function');
    });

    it('should export injectDb function', async () => {
      const module = await import('../../db/db-client');
      expect(typeof module.injectDb).toBe('function');
    });

    it('should export resetDb function', async () => {
      const module = await import('../../db/db-client');
      expect(typeof module.resetDb).toBe('function');
    });
  });

  describe('Database Injection', () => {
    it('should allow injecting a mock database', async () => {
      const mockDb = {
        prepare: vi.fn().mockReturnThis(),
        all: vi.fn().mockReturnValue([]),
        get: vi.fn().mockReturnValue(null),
        run: vi.fn(),
      };

      const { injectDb, getDb, resetDb } = await import('../../db/db-client');
      injectDb(mockDb);

      const db = getDb();
      expect(db).toBe(mockDb);

      resetDb();
    });
  });

  describe('Database Reset', () => {
    it('should reset database connection', async () => {
      const { resetDb } = await import('../../db/db-client');
      resetDb();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
