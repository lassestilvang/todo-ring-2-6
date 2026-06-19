// Service Worker for TaskPlanner PWA
// Enables offline support, push notifications, and background sync

const CACHE_NAME = 'taskplanner-v3';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/globals.css',
  '/favicon.ico',
  '/offline.html',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
];

const SYNC_STORE = 'taskplanner-sync';

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          if (response.ok && response.status === 200) {
            const url = new URL(event.request.url);
            if (url.pathname.startsWith('/api/tasks') || url.pathname.startsWith('/api/lists')) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, response.clone());
              });
            }
          }
          return response;
        })
        .catch(() => {
          // Try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response or fetch from network
        return response || fetch(event.request).then((networkResponse) => {
          // Cache new responses for non-dynamic content
          if (networkResponse.ok && !event.request.url.includes('http')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();

  // Re-sync pending changes
  // This would integrate with the offline cache implementation
}

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json();

  const options = {
    body: data?.body || 'Task update',
    icon: '/icons/icon-192x192.png',
    badge: '/favicon-16x16.png',
    image: data?.image,
    tag: data?.tag || 'task-reminder',
    category: data?.category || 'task',
    actions: [
      { action: 'complete', title: 'Mark Complete' },
      { action: 'snooze', title: 'Snooze 10 min' },
      { action: 'view', title: 'View Task' },
    ],
    data: {
      url: data?.url || '/',
      taskId: data?.taskId,
    },
    requireInteraction: data?.urgent || false,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    self.registration.showNotification(data?.title || 'TaskPlanner', options)
  );
});

// Notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  const url = data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && client.focus) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Message handler for communication with page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});