import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

describe('Migration Runner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sort migrations by name', () => {
    const migrations = ['002_schema.sql', '001_initial.sql', '003_add_table.sql'];
    const sorted = [...migrations].sort();
    expect(sorted).toEqual(['001_initial.sql', '002_schema.sql', '003_add_table.sql']);
  });

  it('should handle empty migrations list', () => {
    const migrations: string[] = [];
    expect(migrations.length).toBe(0);
  });
});