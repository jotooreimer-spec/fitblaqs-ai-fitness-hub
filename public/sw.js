const CACHE_NAME = 'fitblaqs-studio-v3';
const URLS_TO_CACHE = [
  '/',
  '/dashboard',
  '/nutrition',
  '/jogging-tracker',
  '/weight-tracker',
  '/bodyworkout-plan',
  '/performance',
  '/settings',
  '/index.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

// Static files that should NEVER be cached or intercepted (for TWA/Bubblewrap compatibility)
const TWA_STATIC_FILES = ['/manifest.json', '/.well-known/assetlinks.json'];

// Install: Cache all main pages and assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Handle requests with TWA static file bypass
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // CRITICAL: Let TWA static files pass through directly to server (no caching, no interception)
  if (TWA_STATIC_FILES.some(file => url.pathname === file) || url.pathname.startsWith('/.well-known/')) {
    return; // Don't call event.respondWith() - let browser fetch directly
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
