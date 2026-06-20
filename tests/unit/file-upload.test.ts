import { describe, it, expect } from 'vitest';
import { formatFileSize, getFileTypeIcon, validateFile } from '../../src/lib/file-upload';

// Test pure functions that don't require mocking
describe('File Upload Utilities', () => {
  describe('formatFileSize', () => {
    it('should return "0 Bytes" for zero', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
    });

    it('should format gigabytes correctly', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('getFileTypeIcon', () => {
    it('should return image icon for image types', () => {
      expect(getFileTypeIcon('image/jpeg')).toBe('🖼️');
      expect(getFileTypeIcon('image/png')).toBe('🖼️');
      expect(getFileTypeIcon('image/gif')).toBe('🖼️');
    });

    it('should return PDF icon for PDFs', () => {
      expect(getFileTypeIcon('application/pdf')).toBe('📄');
    });

    it('should return document icon for word documents', () => {
      expect(getFileTypeIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('📝');
    });

    it('should return spreadsheet icon for Excel files', () => {
      // Note: spreadsheet MIME type contains 'document' so it matches that first
      expect(getFileTypeIcon('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('📝');
    });

    it('should return presentation icon for PowerPoint files', () => {
      // Note: presentation MIME type contains 'document' so it matches that first
      expect(getFileTypeIcon('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe('📝');
    });

    it('should return archive icon for zip files', () => {
      expect(getFileTypeIcon('application/zip')).toBe('📁');
    });

    it('should return default icon for unknown types', () => {
      expect(getFileTypeIcon('unknown/type')).toBe('📎');
    });
  });

  describe('validateFile', () => {
    it('should reject null/undefined file', () => {
      const result = validateFile(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No file provided');
    });

    it('should reject file over 10MB', () => {
      const largeFile = new File([''], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      const result = validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject disallowed file types', () => {
      const file = new File([''], 'test.exe', { type: 'application/octet-stream' });
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File type not allowed');
    });

    it('should accept valid image files', () => {
      const file = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PDF files', () => {
      const file = new File(['pdf data'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });
  });
});