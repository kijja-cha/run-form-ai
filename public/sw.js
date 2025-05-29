// RunForm.AI - Service Worker (Stability-First Version)
// Caches resources for better performance but prioritizes functionality

const CACHE_NAME = 'runform-ai-v2.0.1';
const STATIC_CACHE = 'runform-static-v2.0.1';
const DYNAMIC_CACHE = 'runform-dynamic-v2.0.1';

// Resources to cache immediately (reduced list for stability)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/app-main.js',
    '/phase2-features.js',
    '/demo-config.js'
];

// External libraries (cache on demand only)
const EXTERNAL_LIBS = [
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// MediaPipe resources (do not cache - always fetch fresh for stability)
const MEDIAPIPE_LIBS = [
    'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
    'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
];

// Install event - cache only essential static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing (stability-first)...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching essential static assets...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Essential assets cached successfully');
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.warn('⚠️ Some assets failed to cache, continuing anyway:', error);
                return self.skipWaiting(); // Continue even if some caching fails
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

// Fetch event - prioritize network for critical resources
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Always fetch MediaPipe libraries fresh (no caching for stability)
    if (MEDIAPIPE_LIBS.some(lib => event.request.url === lib)) {
        console.log('🌐 Fetching MediaPipe library fresh:', event.request.url);
        event.respondWith(
            fetch(event.request).catch(error => {
                console.error('❌ Failed to fetch MediaPipe library:', event.request.url, error);
                // Return a minimal error script instead of failing completely
                return new Response(
                    `console.error("Failed to load MediaPipe library: ${event.request.url}");`,
                    { headers: { 'Content-Type': 'application/javascript' } }
                );
            })
        );
        return;
    }
    
    // Handle different types of requests
    if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
        // Static assets - network first, then cache
        event.respondWith(networkFirstStrategy(event.request, STATIC_CACHE));
    } 
    else if (EXTERNAL_LIBS.some(lib => event.request.url === lib)) {
        // External libraries - cache first with network fallback
        event.respondWith(cacheFirstWithFallback(event.request, DYNAMIC_CACHE));
    }
    else if (url.origin === location.origin) {
        // Same-origin requests - network first
        event.respondWith(networkFirstStrategy(event.request, DYNAMIC_CACHE));
    }
    // For all other external requests, let them pass through without intervention
});

// Network first strategy (for critical resources)
async function networkFirstStrategy(request, cacheName) {
    try {
        console.log('🌐 Network first for:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, networkResponse.clone()).catch(error => {
                console.warn('⚠️ Cache put failed:', error);
            });
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📁 Network failed, trying cache:', request.url);
        
        try {
            const cache = await caches.open(cacheName);
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
                console.log('📁 Serving from cache:', request.url);
                return cachedResponse;
            }
        } catch (cacheError) {
            console.warn('⚠️ Cache access failed:', cacheError);
        }
        
        // If all else fails, throw the original error
        throw error;
    }
}

// Cache first with fallback (for non-critical external libraries)
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
            cache.put(request, responseToCache).catch(error => {
                console.warn('⚠️ Failed to cache library:', error);
            });
            console.log('💾 Cached external library:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ Failed to fetch library:', request.url, error);
        
        // Return a basic error response for JS files
        if (request.url.endsWith('.js')) {
            return new Response(
                `console.warn("Failed to load library: ${request.url}");`,
                { headers: { 'Content-Type': 'application/javascript' } }
            );
        }
        
        throw error;
    }
}

// Message handling for cache management
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CLEAR_CACHE':
            clearAllCaches().then(() => {
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

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames.map(cacheName => {
            if (cacheName.startsWith('runform-')) {
                console.log('🗑️ Deleting cache:', cacheName);
                return caches.delete(cacheName);
            }
        });
        await Promise.all(deletePromises);
        console.log('✅ All caches cleared');
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
        throw error;
    }
}

// Get cache status
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const status = {};
        
        for (const cacheName of cacheNames) {
            try {
                const cache = await caches.open(cacheName);
                const keys = await cache.keys();
                status[cacheName] = {
                    count: keys.length,
                    urls: keys.map(request => request.url)
                };
            } catch (error) {
                console.warn(`⚠️ Failed to access cache ${cacheName}:`, error);
                status[cacheName] = { error: error.message };
            }
        }
        
        return status;
    } catch (error) {
        console.error('❌ Failed to get cache status:', error);
        throw error;
    }
}

console.log('✅ Service Worker ready (stability-first)');

// Handle updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 