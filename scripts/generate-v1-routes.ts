/**
 * Script to generate v1 API route placeholders
 * These routes provide consistent versioning headers for backward compatibility
 */

import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const apiDirs = [
  'comments',
  'push-subscription',
  'tasks',
  'notification-settings',
  'calendar',
  'sharing',
  'cache',
  'goals',
  'lists',
  'saved-views',
  'analytics-insights',
  'email-templates',
  'auth',
  'health',
  'time-blocking',
  'labels',
  'focus-sessions',
  'dependencies',
  'task-batches',
  'analytics',
  'reminders',
  'subtasks',
  'themes',
  'habit-streaks',
  'time-entries',
  'templates',
  'ai',
];

const routeTemplate = (routeName: string) => `/**
 * API v1 ${routeName} Route
 * Versioned endpoint with automatic response headers
 */

import { NextRequest } from 'next/server';
import { addVersionHeaders, extractApiVersion } from '@/lib/api-versioning';
import { jsonError, jsonSuccess } from '@/lib/api-response';
import { ErrorCodes } from '@/lib/error-codes';

// NOTE: For full implementation, import and use the repository pattern
// import { getTaskRepository } from '@/lib/repositories';

export async function GET(request: NextRequest) {
  try {
    const version = extractApiVersion(request);
    // Add your GET logic here using repositories
    const response = jsonSuccess([]);
    return addVersionHeaders(response, version as any);
  } catch (error: unknown) {
    const response = jsonError(error instanceof Error ? error.message : 'Internal error', 500, ErrorCodes.INTERNAL_ERROR);
    return addVersionHeaders(response, 'v1');
  }
}

export async function POST(request: NextRequest) {
  try {
    const version = extractApiVersion(request);
    // Add your POST logic here
    const response = jsonSuccess({});
    return addVersionHeaders(response, version as any);
  } catch (error: unknown) {
    const response = jsonError(error instanceof Error ? error.message : 'Internal error', 500, ErrorCodes.INTERNAL_ERROR);
    return addVersionHeaders(response, 'v1');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const version = extractApiVersion(request);
    // Add your PUT logic here
    const response = jsonSuccess({});
    return addVersionHeaders(response, version as any);
  } catch (error: unknown) {
    const response = jsonError(error instanceof Error ? error.message : 'Internal error', 500, ErrorCodes.INTERNAL_ERROR);
    return addVersionHeaders(response, 'v1');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const version = extractApiVersion(request);
    // Add your DELETE logic here
    const response = jsonSuccess({ success: true });
    return addVersionHeaders(response, version as any);
  } catch (error: unknown) {
    const response = jsonError(error instanceof Error ? error.message : 'Internal error', 500, ErrorCodes.INTERNAL_ERROR);
    return addVersionHeaders(response, 'v1');
  }
}
`;

async function generateV1Routes() {
  const apiPath = path.join(process.cwd(), 'src', 'app', 'api');

  for (const dir of apiDirs) {
    const v1Path = path.join(apiPath, 'v1', dir);
    if (!existsSync(v1Path)) {
      await mkdir(v1Path, { recursive: true });
      await writeFile(path.join(v1Path, 'route.ts'), routeTemplate(dir));
      console.log(`Created /api/v1/${dir}/route.ts`);
    }
  }

  console.log('Done!');
}

generateV1Routes().catch(console.error);