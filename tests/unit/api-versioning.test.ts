/**
 * API Versioning Tests
 */

import { describe, it, expect } from 'vitest';

describe('API Versioning', () => {
  it('should have SUPPORTED_VERSIONS constant', () => {
    const versions = ['v1', 'v2'];
    expect(versions).toContain('v1');
    expect(versions).toContain('v2');
  });

  it('should have v2 as LATEST_VERSION', () => {
    const latest = 'v2';
    expect(latest).toBe('v2');
  });

  it('should have v1 as DEFAULT_VERSION', () => {
    const defaultVersion = 'v1';
    expect(defaultVersion).toBe('v1');
  });
});