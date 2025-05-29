// RunForm.AI - Service Worker
// Caches resources for better performance and offline capability

const CACHE_NAME = 'runform-ai-v2.0.0';
const STATIC_CACHE = 'runform-static-v2.0.0';
const DYNAMIC_CACHE = 'runform-dynamic-v2.0.0';

// Resources to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/app-main.js',
    '/phase2-features.js',
    '/demo-config.js',
    '/utils/lazy-loader.js',
    '/utils/performance-monitor.js',
    '/workers/pose-analysis-worker.js'
];

// External libraries (cache on first load)
const EXTERNAL_LIBS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// MediaPipe resources (cache on demand)
const MEDIAPIPE_LIBS = [
    'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Static assets cached successfully');
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Failed to cache static assets:', error);
            })
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old cache versions
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName.startsWith('runform-')) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                // Take control of all clients immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
        // Static assets - cache first strategy
        event.respondWith(cacheFirstStrategy(event.request, STATIC_CACHE));
    } 
    else if (EXTERNAL_LIBS.some(lib => event.request.url === lib) || 
             MEDIAPIPE_LIBS.some(lib => event.request.url === lib)) {
        // External libraries - cache first with fallback
        event.respondWith(cacheFirstWithFallback(event.request, DYNAMIC_CACHE));
    }
    else if (url.origin === location.origin) {
        // Same-origin requests - network first with cache fallback
        event.respondWith(networkFirstStrategy(event.request, DYNAMIC_CACHE));
    }
    else {
        // External requests - network only (don't cache user videos, etc.)
        return;
    }
});

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📁 Serving from cache:', request.url);
            return cachedResponse;
        }
        
        console.log('🌐 Fetching from network:', request.url);
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Cache first strategy failed:', error);
        throw error;
    }
}

// Cache first with fallback (for external libraries)
async function cacheFirstWithFallback(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('📁 Serving library from cache:', request.url);
            return cachedResponse;
        }
        
        console.log('🌐 Fetching library from network:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache with expiration for external libs
            const responseToCache = networkResponse.clone();
            cache.put(request, responseToCache);
            console.log('💾 Cached external library:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Failed to fetch library:', request.url, error);
        
        // Return a basic error response for JS files
        if (request.url.endsWith('.js')) {
            return new Response('console.warn("Failed to load library: ' + request.url + '");', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        throw error;
    }
}

// Network first strategy (for dynamic content)
async function networkFirstStrategy(request, cacheName) {
    try {
        console.log('🌐 Network first for:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📁 Network failed, trying cache:', request.url);
        
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_LIBRARY':
            cacheLibrary(data.url).then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache(data.cacheName).then(() => {
                event.ports[0].postMessage({ success: true });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        case 'GET_CACHE_STATUS':
            getCacheStatus().then((status) => {
                event.ports[0].postMessage({ success: true, data: status });
            }).catch((error) => {
                event.ports[0].postMessage({ success: false, error: error.message });
            });
            break;
            
        default:
            console.warn('Unknown message type:', type);
    }
});

// Cache specific library
async function cacheLibrary(url) {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const response = await fetch(url);
        
        if (response.ok) {
            await cache.put(url, response);
            console.log('💾 Library cached:', url);
        }
    } catch (error) {
        console.error('❌ Failed to cache library:', url, error);
        throw error;
    }
}

// Clear specific cache
async function clearCache(cacheName) {
    try {
        const deleted = await caches.delete(cacheName || DYNAMIC_CACHE);
        console.log(deleted ? '🗑️ Cache cleared' : '⚠️ Cache not found');
    } catch (error) {
        console.error('❌ Failed to clear cache:', error);
        throw error;
    }
}

// Get cache status
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const status = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            status[cacheName] = {
                count: keys.length,
                urls: keys.map(request => request.url)
            };
        }
        
        return status;
    } catch (error) {
        console.error('❌ Failed to get cache status:', error);
        throw error;
    }
}

// Periodic cache cleanup
async function performCacheCleanup() {
    try {
        const cache = await caches.open(DYNAMIC_CACHE);
        const requests = await cache.keys();
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        for (const request of requests) {
            const response = await cache.match(request);
            const dateHeader = response.headers.get('date');
            
            if (dateHeader) {
                const responseTime = new Date(dateHeader).getTime();
                if (now - responseTime > maxAge) {
                    await cache.delete(request);
                    console.log('🗑️ Removed old cached resource:', request.url);
                }
            }
        }
    } catch (error) {
        console.error('❌ Cache cleanup failed:', error);
    }
}

// Run cleanup every 24 hours
setInterval(performCacheCleanup, 24 * 60 * 60 * 1000);

console.log('✅ Service Worker ready');

// Handle updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 