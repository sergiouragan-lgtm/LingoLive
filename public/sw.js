const CACHE_NAME = 'lingolive-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico'
];

// Install Event - cache core static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline shell');
      // Use helper to add all, catching errors for missing individual files
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[Service Worker] Failed to pre-cache asset: ${url}`, err);
          });
        })
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - network first with cache fallback for pages, cache first for static files
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or APIs (e.g., Firebase, Firestore, ElevenLabs, local express API, LiveKit, etc.)
  if (
    request.method !== 'GET' || 
    url.pathname.startsWith('/api') || 
    url.hostname.includes('firestore') || 
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('elevenlabs')
  ) {
    return;
  }

  // Handle local application routes (SPAs)
  // If the request is for a document (navigation page), serve index.html from cache as fallback
  if (request.mode === 'navigate' || (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Put in cache for future offline use
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/', responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // For static assets (JS, CSS, images, fonts, icons), use Cache-First with Network Update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background to keep cache up to date (stale-while-revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => { /* ignore background sync errors */ });

        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return new Response('Offline content unavailable', { status: 503, statusText: 'Offline' });
        });
    })
  );
});

// Helper to get pending vocabulary syncs from IndexedDB (Version 2 contains vocab_sync_outbox)
function getPendingSyncsFromIDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LingoLiveOfflineDB', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('vocab_sync_outbox')) {
        resolve([]);
        return;
      }
      try {
        const transaction = db.transaction('vocab_sync_outbox', 'readonly');
        const store = transaction.objectStore('vocab_sync_outbox');
        const getRequest = store.getAll();
        getRequest.onsuccess = () => resolve(getRequest.result || []);
        getRequest.onerror = () => reject(getRequest.error);
      } catch (err) {
        resolve([]);
      }
    };
  });
}

// Helper to remove processed vocabulary syncs from IndexedDB
function deletePendingSyncFromIDB(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LingoLiveOfflineDB', 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction('vocab_sync_outbox', 'readwrite');
        const store = transaction.objectStore('vocab_sync_outbox');
        const deleteRequest = store.delete(id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      } catch (err) {
        reject(err);
      }
    };
  });
}

// Background Sync Handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'lingolive-vocabulary-sync' || event.tag === 'sync-vocabulary') {
    console.log(`[Service Worker] Background sync event triggered: ${event.tag}`);
    event.waitUntil(performVocabSync());
  }
});

async function performVocabSync() {
  try {
    const pendingSyncs = await getPendingSyncsFromIDB();
    if (pendingSyncs.length === 0) {
      console.log('[Service Worker] No pending vocabulary sync jobs found.');
      return;
    }

    console.log(`[Service Worker] Syncing ${pendingSyncs.length} pending vocabulary update jobs.`);
    for (const syncJob of pendingSyncs) {
      const { id, userId, words } = syncJob;
      try {
        const response = await fetch('/api/sync-vocabulary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId, words }),
        });

        if (response.ok) {
          console.log('[Service Worker] Vocabulary sync completed.');
          await deletePendingSyncFromIDB(id);
        } else {
          console.error(`[Service Worker] Background sync endpoint returned non-OK status: ${response.status}`);
          throw new Error('Server returned error status'); // Throwing triggers retry later by the browser
        }
      } catch (err) {
        console.error('[Service Worker] Network error while syncing:', err instanceof Error ? err.message : err);
        throw err; // Throwing triggers retry later by the browser
      }
    }
  } catch (error) {
    console.error('[Service Worker] performVocabSync failed:', error);
    throw error;
  }
}

