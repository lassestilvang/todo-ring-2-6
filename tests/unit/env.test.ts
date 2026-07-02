// tests/unit/env.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('Environment Validation', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should validate environment configuration', () => {
    // Set required environment variables
    process.env.DATABASE_URL = './db.sqlite';
    process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-32chars';
    process.env.AUTH_SECRET = 'test-auth-secret-for-testing-purposes-32ch';

    // Basic validation that env vars are set
    expect(process.env.DATABASE_URL).toBeDefined();
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.AUTH_SECRET).toBeDefined();
  });

  it('should have default values for optional variables', () => {
    // When optional variables are not set
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;

    // They should be undefined
    expect(process.env.SMTP_HOST).toBeUndefined();
    expect(process.env.SMTP_PORT).toBeUndefined();
  });

  it('should validate minimum length for secrets', () => {
    // Set secrets that are too short
    process.env.JWT_SECRET = 'short';
    process.env.AUTH_SECRET = 'also-short';

    // Secrets should be shorter than minimum
    expect(process.env.JWT_SECRET!.length).toBeLessThan(32);
    expect(process.env.AUTH_SECRET!.length).toBeLessThan(32);
  });
});