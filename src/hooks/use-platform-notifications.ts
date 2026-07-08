/**
 * Platform-aware notification hook
 * Provides platform-specific notification preferences and delivery
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationPlatform } from '@/lib/notification-scheduler';

interface PlatformPreferences {
  mobile: boolean;
  desktop: boolean;
  web: boolean;
  email: boolean;
}

interface NotificationResult {
  platform: NotificationPlatform;
  success: boolean;
  error?: string;
}

/**
 * Hook to fetch user notification preferences
 */
export function usePlatformPreferences() {
  return useQuery<PlatformPreferences>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/v1/user/notification-preferences');
      if (!res.ok) throw new Error('Failed to fetch preferences');
      const data = await res.json();
      return data.data || {
        mobile: true,
        desktop: true,
        web: true,
        email: true,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update platform notification preferences
 */
export function useUpdatePlatformPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<PlatformPreferences>) => {
      const res = await fetch('/api/v1/user/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (!res.ok) throw new Error('Failed to update preferences');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}

/**
 * Hook to send platform-aware notifications
 */
export function useSendPlatformNotification() {
  return useMutation<NotificationResult[], Error, { taskId: string; platform?: NotificationPlatform }>({
    mutationFn: async ({ taskId, platform }) => {
      const res = await fetch(`/api/v1/tasks/${taskId}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ platform }),
      });

      if (!res.ok) throw new Error('Failed to send notification');
      const data = await res.json();
      return data.data as NotificationResult[];
    },
  });
}

/**
 * Hook to register push subscription with platform detection
 */
export function useRegisterPushSubscription() {
  return useMutation({
    mutationFn: async (subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
      userAgent?: string;
    }) => {
      // Detect platform from user agent
      const platform = detectPlatform(subscription.userAgent);

      const res = await fetch('/api/v1/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...subscription,
          platform,
        }),
      });

      if (!res.ok) throw new Error('Failed to register subscription');
      return res.json();
    },
  });
}

function detectPlatform(userAgent?: string): NotificationPlatform {
  if (!userAgent) return 'desktop';

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  return 'desktop';
}