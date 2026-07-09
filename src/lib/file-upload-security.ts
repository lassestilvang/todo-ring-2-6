/**
 * File upload security validation
 * Validates file type, size, and path traversal protection
 */
export function validateFileUpload(file: {
  originalname: string;
  mimetype: string;
  size: number;
}): boolean {
  // 1. Allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/json',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return false;
  }

  // 2. Max file size (5MB)
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    return false;
  }

  // 3. Path traversal protection
  if (file.originalname.includes('..')) {
    return false;
  }

  // All checks passed
  return true;
}