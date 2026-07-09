/**
 * Template marketplace file upload security tests
 * Tests file type validation, size limits, and path traversal protection
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateFileUpload } from '../../src/lib/file-upload-security';

describe('File Upload Security', () => {
  const mockFile = {
    originalname: 'test.png',
    mimetype: 'image/png',
    size: 1024 * 100, // 100KB
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept valid image file', () => {
    const result = validateFileUpload(mockFile);
    expect(result).toBe(true);
  });

  it('should reject executable file', () => {
    const badFile = { ...mockFile, mimetype: 'application/x-executable' };
    const result = validateFileUpload(badFile);
    expect(result).toBe(false);
  });

  it('should reject file exceeding size limit', () => {
    const largeFile = { ...mockFile, size: 10 * 1024 * 1024 }; // 10MB
    const result = validateFileUpload(largeFile);
    expect(result).toBe(false);
  });

  it('should reject path traversal in filename', () => {
    const badFile = { ...mockFile, originalname: '../../etc/passwd' };
    const result = validateFileUpload(badFile);
    expect(result).toBe(false);
  });
});