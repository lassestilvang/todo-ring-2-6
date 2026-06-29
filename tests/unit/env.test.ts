// tests/unit/env.test.ts
import { getEnv } from '@/lib/env';

describe('Environment Validation', () => {
  beforeEach(() => {
    // Reset the module cache to simulate fresh environment
    jest.resetModules();
  });

  it('should throw when required environment variables are missing', () => {
    // Delete required environment variables
    delete process.env.JWT_SECRET;
    delete process.env.AUTH_SECRET;

    // Expect an error when trying to get the environment
    expect(() => getEnv()).toThrow();
  });

  it('should return default values when optional variables are missing', () => {
    // Set only the required variables
    process.env.JWT_SECRET = 'a'.repeat(32); // 32 characters
    process.env.AUTH_SECRET = 'b'.repeat(32); // 32 characters

    // Get the environment
    const env = getEnv();

    // Check that defaults are set
    expect(env.DATABASE_URL).toBe('./db.sqlite');
    expect(env.NODE_ENV).toBe('development');
    expect(env.SMTP_HOST).toBeUndefined();
  });

  it('should validate minimum length for secrets', () => {
    // Set secrets that are too short
    process.env.JWT_SECRET = 'short'; // less than 32 characters
    process.env.AUTH_SECRET = 'also short';

    // Expect an error
    expect(() => getEnv()).toThrow();
  });
});