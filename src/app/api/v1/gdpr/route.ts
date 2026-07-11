import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ensureDbInitialized } from '@/lib/db-init';
import { redisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

ensureDbInitialized();

/**
 * GDPR Data Export Endpoint
 * GET /api/v1/gdpr/export?userId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return jsonError('User ID required', 400, 'MISSING_USER_ID');
    }

    // Generate export file
    const exportData = await generateDataExport(userId);
    const exportId = uuidv4();

    // Store export for download (24h TTL)
    await redisClient.setex(
      `gdpr-export:${exportId}`,
      24 * 60 * 60,
      JSON.stringify(exportData)
    );

    return jsonSuccess({
      exportId,
      downloadUrl: `/api/v1/gdpr/download/${exportId}`,
      expiresIn: 24 * 60 * 60 // seconds
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return jsonError(message, 500, 'EXPORT_ERROR');
  }
}

/**
 * GDPR Data Deletion Endpoint
 * DELETE /api/v1/gdpr/delete?userId=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return jsonError('User ID required', 400, 'MISSING_USER_ID');
    }

    // Perform deletion
    await deleteUserData(userId);

    // Log for audit
    await logGdprAction(userId, 'data_deletion');

    return jsonSuccess({
      message: 'User data deleted successfully',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deletion failed';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

/**
 * Download Exported Data
 * GET /api/v1/gdpr/download/:exportId
 */
export async function GET(req: NextRequest, { params }: { params: { exportId: string } }) {
  try {
    const exportData = await redisClient.get(`gdpr-export:${params.exportId}`);

    if (!exportData) {
      return jsonError('Export not found or expired', 404, 'EXPORT_NOT_FOUND');
    }

    const data = JSON.parse(exportData);

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr-export-${params.exportId}.json"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    return jsonError(message, 500, 'DOWNLOAD_ERROR');
  }
}

/**
 * Generate GDPR-compliant data export
 */
async function generateDataExport(userId: string) {
  // Implementation would query all user data from various tables
  return {
    userId,
    exportTimestamp: new Date().toISOString(),
    data: {
      profile: await getUserProfile(userId),
      tasks: await getUserTasks(userId),
      notes: await getUserNotes(userId),
      preferences: await getUserPreferences(userId),
      activityLog: await getUserActivityLog(userId)
    }
  };
}

/**
 * Delete all user data
 */
async function deleteUserData(userId: string) {
  // Implementation would delete from all relevant tables
  await Promise.all([
    deleteUserProfile(userId),
    deleteUserTasks(userId),
    deleteUserNotes(userId),
    deleteUserPreferences(userId),
    deleteUserActivityLog(userId)
  ]);
}

/**
 * Log GDPR action for audit
 */
async function logGdprAction(userId: string, action: string) {
  // Implementation would log to audit table
  console.log(`GDPR Action: ${action} for user ${userId} at ${new Date().toISOString()}`);
}

// Mock data fetchers (replace with actual DB queries)
async function getUserProfile(userId: string) { return { id: userId, email: 'user@example.com' }; }
async function getUserTasks(userId: string) { return []; }
async function getUserNotes(userId: string) { return []; }
 async function getUserPreferences(userId: string) { return {}; }
async function getUserActivityLog(userId: string) { return []; }
async function deleteUserProfile(userId: string) => ... but let me cut this off and complete the implementation properly.

Actually, let me continue with a more concise version.

<tool_call>
<function=Write>
<parameter=content>
import { NextRequest } from 'next/server';
import { jsonSuccess, jsonError } from '@/lib/api-response';
import { ensureDbInitialized } from '@/lib/db-init';
import { redisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

ensureDbInitialized();

/**
 * GDPR Data Export Endpoint
 * GET /api/v1/gdpr/export?userId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return jsonError('User ID required', 400, 'MISSING_USER_ID');
    }

    // Generate export file
    const exportData = await generateDataExport(userId);
    const exportId = uuidv4();

    // Store export for download (24h TTL)
    await redisClient.setex(
      `gdpr-export:${exportId}`,
      24 * 60 * 60,
      JSON.stringify(exportData)
    );

    return jsonSuccess({
      exportId,
      downloadUrl: `/api/v1/gdpr/download/${exportId}`,
      expiresIn: 24 * 60 * 60 // seconds
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    return jsonError(message, 500, 'EXPORT_ERROR');
  }
}

/**
 * GDPR Data Deletion Endpoint
 * DELETE /api/v1/gdpr/delete?userId=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return jsonError('User ID required', 400, 'MISSING_USER_ID');
    }

    // Perform deletion
    await deleteUserData(userId);

    // Log for audit
    await logGdprAction(userId, 'data_deletion');

    return jsonSuccess({
      message: 'User data deleted successfully',
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deletion failed';
    return jsonError(message, 500, 'DELETE_ERROR');
  }
}

/**
 * Download Exported Data
 * GET /api/v1/gdpr/download/:exportId
 */
export async function GET(req: NextRequest, { params }: { params: { exportId: string } }) {
  try {
    const exportData = await redisClient.get(`gdpr-export:${params.exportId}`);

    if (!exportData) {
      return jsonError('Export not found or expired', 404, 'EXPORT_NOT_FOUND');
    }

    const data = JSON.parse(exportData);

    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="gdpr-export-${params.exportId}.json"`
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    return jsonError(message, 500, 'DOWNLOAD_ERROR');
  }
}

/**
 * Generate GDPR-compliant data export
 */
async function generateDataExport(userId: string) {
  // Implementation would query all user data from various tables
  return {
    userId,
    exportTimestamp: new Date().toISOString(),
    data: {
      profile: await getUserProfile(userId),
      tasks: await getUserTasks(userId),
      notes: await getUserNotes(userId),
      preferences: await getUserPreferences(userId),
      activityLog: await getUserActivityLog(userId)
    }
  };
}

/**
 * Delete all user data
 */
async function deleteUserData(userId: string) {
  // Implementation would delete from all relevant tables
  await Promise.all([
    deleteUserProfile(userId),
    deleteUserTasks(userId),
    deleteUserNotes(userId),
    deleteUserPreferences(userId),
    deleteUserActivityLog(userId)
  ]);
}

/**
 * Log GDPR action for audit
 */
async function logGdprAction(userId: string, action: string) {
  // Implementation would log to audit table
  console.log(`GDPR Action: ${action} for user ${userId} at ${new Date().toISOString()}`);
}

/**
 * Mock data fetchers (replace with actual DB queries)
 */
async function getUserProfile(userId: string) {
  return { id: userId, email: 'user@example.com', name: 'John Doe' };
}

async function getUserTasks(userId: string) {
  return [
    { id: 't1', title: 'Sample Task', completed: false, createdAt: new Date().toISOString() }
  ];
}

async function getUserNotes(userId: string) {
  return [
    { id: 'n1', content: 'Sample Note', createdAt: new Date().toISOString() }
  ];
}

async function getUserPreferences(userId: string) {
  return {
    theme: 'dark',
    notifications: true,
    language: 'en'
  };
}

async function getUserActivityLog(userId: string) {
  return [
    { action: 'login', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { action: 'task_created', timestamp: new Date().toISOString() }
  ];
}

async function deleteUserProfile(userId: string) {
  // DB operation
  console.log(`Deleting profile for user ${userId}`);
}

async function deleteUserTasks(userId: string) {
  // DB operation
  console.log(`Deleting tasks for user ${userId}`);
}

async function deleteUserNotes(userId: string) {
  // DB operation
  console.log(`Deleting notes for user ${userId}`);
}

async function deleteUserPreferences(userId: string) {
  // DB operation
  console.log(`Deleting preferences for user ${userId}`);
}

async function deleteUserActivityLog(userId: string) {
  // DB operation
  console.log(`Deleting activity log for user ${userId}`);
}