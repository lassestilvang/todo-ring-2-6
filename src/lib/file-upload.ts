import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  // Documents
  'application/pdf',
  'text/plain',
  'text/markdown',
  // Office documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
];

export interface UploadResult {
  success: boolean;
  filePath?: string;
  filename?: string;
  error?: string;
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  return { valid: true };
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  // Ensure upload directory exists
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  // Generate unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${randomUUID()}.${fileExtension}`;
  const filePath = join(UPLOAD_DIR, uniqueFilename);

  // Convert file to buffer and write
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    success: true,
    filePath: `/uploads/${uniqueFilename}`,
    filename: file.name,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileTypeIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
  if (fileType.includes('presentation')) return '📈';
  if (fileType.includes('zip') || fileType.includes('archive')) return '📁';
  return '📎';
}