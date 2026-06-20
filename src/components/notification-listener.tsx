'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationListener() {
  const { permission, requestPermission } = useNotifications();

  useEffect(() => {
    if (permission === 'default') {
      requestPermission().then((p) => {
        if (p === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }, [permission, requestPermission]);

  return null;
}