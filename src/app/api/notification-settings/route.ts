import { NextRequest } from 'next/server';
import { NotificationSettingsRepository } from '@/lib/repositories/notification-settings-repository';
import { jsonSuccess, jsonError } from '@/lib/api-response';

// Validation helpers
function validateQuietHours(time: string): boolean {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    const settings = await NotificationSettingsRepository.getNotificationSettingsRepository().findByUserId(userId);
    return jsonSuccess(settings || {
      userId,
      emailNotifications: true,
      pushNotifications: true,
      reminderLeadTime: 15,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      notificationDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to fetch notification settings', 500);
  }
}


export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...settings } = body;

    if (!userId) {
      return jsonError('userId is required', 400, 'MISSING_USER_ID');
    }

    // Validate quiet hours
    const { quietHoursStart, quietHoursEnd } = settings;

    if (quietHoursStart && !validateQuietHours(quietHoursStart)) {
      return jsonError('Invalid quiet hours format (HH:MM)', 400);
    }
    if (quietHoursEnd && !validateQuietHours(quietHoursEnd)) {
      return jsonError('Invalid quiet hours format (HH:MM)', 400);
    }

    // Call repository with validated data
    const updated = await NotificationSettingsRepository.getNotificationSettingsRepository().update(userId, settings);
    return jsonSuccess(updated);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Failed to update notification settings', 500);
  }
}