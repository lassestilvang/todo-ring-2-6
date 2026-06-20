'use client';

import { useEffect, useCallback } from 'react';

type PermissionState = 'default' | 'granted' | 'denied';

interface NotificationPermission {
  permission: PermissionState;
  requestPermission: () => Promise<PermissionState>;
  subscribeToPush: () => Promise<boolean>;
}

export function useNotifications(): NotificationPermission {
  const permission = typeof window !== 'undefined' ? (Notification.permission as PermissionState) : 'default';

  const requestPermission = useCallback(async (): Promise<PermissionState> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (permission === 'granted') {
      return permission;
    }

    const newPermission = await Notification.requestPermission();
    return newPermission as PermissionState;
  }, [permission]);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    try {
      const swRegistration = await navigator.serviceWorker.ready;
      const options: any = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''),
      };

      const subscription = await swRegistration.pushManager.subscribe(options);

      // Send subscription to server
      await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      return true;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return false;
    }
  }, []);

  // Check for scheduled reminders and show notifications
  useEffect(() => {
    if (permission !== 'granted') return;

    const checkReminders = async () => {
      try {
        const res = await fetch('/api/reminders?upcoming=true');
        const json = await res.json();
        if (json.success) {
          for (const reminder of json.data) {
            const remindAt = new Date(reminder.remindAt);
            const now = new Date();

            if (remindAt <= now) {
              // Show browser notification
              new Notification('Task Reminder', {
                body: 'A task needs your attention',
                icon: '/favicon.ico',
              });

              // Mark as fired
              await fetch(`/api/reminders?id=${reminder.id}`, { method: 'DELETE' });
            }
          }
        }
      } catch (error) {
        console.error('Failed to check reminders:', error);
      }
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    checkReminders(); // Check immediately

    return () => clearInterval(interval);
  }, [permission]);

  return { permission, requestPermission, subscribeToPush };
}

// Utility to convert base64 to Uint8Array for VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = 2 - (base64String.length % 4);
  const paddingString = padding === 2 ? '' : new Array(padding + 1).join('=');
  const base64 = (base64String + paddingString)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Utility to show persistent notifications
export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, options);
  }
  return null;
}