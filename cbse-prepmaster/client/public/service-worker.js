/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'cbse-prepmaster-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap',
];

const DYNAMIC_CACHE_NAME = 'cbse-prepmaster-dynamic-v1';
const API_CACHE_NAME = 'cbse-prepmaster-api-v1';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== DYNAMIC_CACHE_NAME &&
              name !== API_CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Helper function to check if request is for API
const isApiRequest = (url) => url.startsWith(API_URL);

// Helper function to check if request is for static assets
const isStaticAsset = (url) => {
  const staticPatterns = [
    '/static/',
    '/assets/',
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.ico',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
  ];
  return staticPatterns.some((pattern) => url.includes(pattern));
};

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests
  if (isApiRequest(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();

          // Only cache successful GET requests
          if (request.method === 'GET' && response.status === 200) {
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }

          return response;
        })
        .catch(() => {
          // If offline, try to get from cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // If no cached response, return offline JSON
            return new Response(
              JSON.stringify({
                error: 'You are offline. Please check your internet connection.',
                offline: true,
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            );
          });
        })
    );
    return;
  }

  // Handle static asset requests
  if (isStaticAsset(url.href)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Default fetch behavior
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'submit-test') {
    event.waitUntil(syncTestSubmission());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Helper function to sync test submissions
async function syncTestSubmission() {
  try {
    const cache = await caches.open(API_CACHE_NAME);
    const requests = await cache.keys();
    const testSubmissions = requests.filter((request) => 
      request.url.includes('/api/results/submit')
    );

    return Promise.all(
      testSubmissions.map(async (request) => {
        try {
          const response = await fetch(request.clone());
          if (response.ok) {
            await cache.delete(request);
          }
          return response;
        } catch (error) {
          console.error('Sync failed:', error);
        }
      })
    );
  } catch (error) {
    console.error('Sync error:', error);
  }
}
