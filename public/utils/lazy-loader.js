// RunForm.AI - Lazy Loading Manager
// Loads heavy resources only when needed for better performance

console.log('📦 Lazy Loader initialized');

class LazyLoader {
    constructor() {
        this.loadedLibraries = new Set();
        this.loadingPromises = new Map();
        this.performanceMetrics = {
            loadTimes: {},
            memoryBefore: 0,
            memoryAfter: 0
        };
    }

    // Library configurations
    static libraries = {
        chartjs: {
            url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
            check: () => typeof Chart !== 'undefined',
            priority: 'low'
        },
        jspdf: {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
            check: () => typeof window.jsPDF !== 'undefined',
            priority: 'low'
        },
        html2canvas: {
            url: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
            check: () => typeof html2canvas !== 'undefined',
            priority: 'low'
        },
        mediapipe_camera: {
            url: 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
            check: () => typeof Camera !== 'undefined',
            priority: 'high'
        },
        mediapipe_drawing: {
            url: 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
            check: () => typeof drawConnectors !== 'undefined',
            priority: 'medium'
        },
        mediapipe_pose: {
            url: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js',
            check: () => typeof Pose !== 'undefined',
            priority: 'critical',
            preload: true
        }
    };

    // Load library with performance monitoring
    async loadLibrary(libraryName) {
        if (this.loadedLibraries.has(libraryName)) {
            return Promise.resolve();
        }

        if (this.loadingPromises.has(libraryName)) {
            return this.loadingPromises.get(libraryName);
        }

        const library = LazyLoader.libraries[libraryName];
        if (!library) {
            throw new Error(`Unknown library: ${libraryName}`);
        }

        // Check if already loaded
        if (library.check()) {
            this.loadedLibraries.add(libraryName);
            return Promise.resolve();
        }

        console.log(`📦 Loading ${libraryName}...`);
        const startTime = performance.now();
        this.performanceMetrics.memoryBefore = this.getMemoryUsage();

        const promise = this.loadScript(library.url, libraryName)
            .then(() => {
                const loadTime = performance.now() - startTime;
                this.performanceMetrics.loadTimes[libraryName] = loadTime;
                this.performanceMetrics.memoryAfter = this.getMemoryUsage();
                
                this.loadedLibraries.add(libraryName);
                console.log(`✅ ${libraryName} loaded in ${loadTime.toFixed(2)}ms`);
                
                // Emit load event
                this.dispatchLoadEvent(libraryName, loadTime);
            });

        this.loadingPromises.set(libraryName, promise);
        return promise;
    }

    // Load script dynamically
    loadScript(url, name) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            script.onload = () => {
                resolve();
            };
            
            script.onerror = () => {
                reject(new Error(`Failed to load ${name} from ${url}`));
            };
            
            // Add loading indicator
            script.setAttribute('data-library', name);
            document.head.appendChild(script);
        });
    }

    // Load multiple libraries
    async loadLibraries(libraryNames) {
        const promises = libraryNames.map(name => this.loadLibrary(name));
        return Promise.all(promises);
    }

    // Load critical libraries first
    async loadCriticalLibraries() {
        const critical = Object.entries(LazyLoader.libraries)
            .filter(([_, config]) => config.priority === 'critical')
            .map(([name, _]) => name);
        
        return this.loadLibraries(critical);
    }

    // Preload libraries in background
    async preloadLibraries() {
        const preload = Object.entries(LazyLoader.libraries)
            .filter(([_, config]) => config.preload)
            .map(([name, _]) => name);
        
        // Load with small delays to not block main thread
        for (const library of preload) {
            try {
                await this.loadLibrary(library);
                await new Promise(resolve => setTimeout(resolve, 10));
            } catch (error) {
                console.warn(`Preload failed for ${library}:`, error);
            }
        }
    }

    // Load libraries on demand based on user action
    async loadOnDemand(feature) {
        const featureLibraries = {
            webcam: ['mediapipe_camera', 'mediapipe_pose'],
            analysis: ['mediapipe_pose', 'mediapipe_drawing'],
            charts: ['chartjs'],
            export: ['jspdf', 'html2canvas'],
            recording: ['mediapipe_camera']
        };

        const required = featureLibraries[feature] || [];
        if (required.length === 0) {
            console.warn(`Unknown feature: ${feature}`);
            return;
        }

        console.log(`🎯 Loading libraries for ${feature}:`, required);
        return this.loadLibraries(required);
    }

    // Get memory usage
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    // Dispatch custom load event
    dispatchLoadEvent(libraryName, loadTime) {
        const event = new CustomEvent('library-loaded', {
            detail: {
                library: libraryName,
                loadTime,
                totalLoaded: this.loadedLibraries.size,
                memoryDelta: this.performanceMetrics.memoryAfter - this.performanceMetrics.memoryBefore
            }
        });
        document.dispatchEvent(event);
    }

    // Get loading status
    getStatus() {
        const total = Object.keys(LazyLoader.libraries).length;
        const loaded = this.loadedLibraries.size;
        const loading = this.loadingPromises.size;
        
        return {
            total,
            loaded,
            loading,
            percentage: (loaded / total) * 100,
            libraries: {
                loaded: Array.from(this.loadedLibraries),
                loading: Array.from(this.loadingPromises.keys())
            }
        };
    }

    // Check if feature is ready
    isFeatureReady(feature) {
        const featureLibraries = {
            webcam: ['mediapipe_camera'],
            analysis: ['mediapipe_pose'],
            charts: ['chartjs'],
            export: ['jspdf', 'html2canvas']
        };

        const required = featureLibraries[feature] || [];
        return required.every(lib => this.loadedLibraries.has(lib));
    }

    // Cleanup unused libraries
    cleanup() {
        // Remove loaded script tags to free memory
        const scripts = document.querySelectorAll('script[data-library]');
        scripts.forEach(script => {
            const libraryName = script.getAttribute('data-library');
            if (!this.shouldKeepLoaded(libraryName)) {
                script.remove();
                this.loadedLibraries.delete(libraryName);
                console.log(`🗑️ Cleaned up ${libraryName}`);
            }
        });
    }

    // Determine if library should stay loaded
    shouldKeepLoaded(libraryName) {
        const keepLoaded = ['mediapipe_pose', 'mediapipe_camera'];
        return keepLoaded.includes(libraryName);
    }

    // Get performance report
    getPerformanceReport() {
        return {
            loadTimes: { ...this.performanceMetrics.loadTimes },
            totalLoadTime: Object.values(this.performanceMetrics.loadTimes)
                .reduce((sum, time) => sum + time, 0),
            averageLoadTime: Object.values(this.performanceMetrics.loadTimes)
                .reduce((sum, time) => sum + time, 0) / this.loadedLibraries.size,
            memoryUsage: this.getMemoryUsage(),
            librariesLoaded: this.loadedLibraries.size
        };
    }
}

// Smart loading strategies
class SmartLoadingStrategy {
    constructor(lazyLoader) {
        this.lazyLoader = lazyLoader;
        this.userBehavior = {
            hasInteracted: false,
            preferredFeatures: [],
            connectionSpeed: this.detectConnectionSpeed()
        };
        this.setupBehaviorTracking();
    }

    // Detect connection speed
    detectConnectionSpeed() {
        if (navigator.connection) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
        }
        return { effectiveType: 'unknown' };
    }

    // Track user behavior
    setupBehaviorTracking() {
        // Track first interaction
        document.addEventListener('click', () => {
            if (!this.userBehavior.hasInteracted) {
                this.userBehavior.hasInteracted = true;
                this.onFirstInteraction();
            }
        }, { once: true });

        // Track feature usage
        document.addEventListener('feature-used', (e) => {
            const feature = e.detail.feature;
            if (!this.userBehavior.preferredFeatures.includes(feature)) {
                this.userBehavior.preferredFeatures.push(feature);
                this.adaptLoadingStrategy();
            }
        });
    }

    // Load libraries when user first interacts
    async onFirstInteraction() {
        console.log('👆 First interaction detected - loading core libraries');
        
        // Load based on connection speed
        if (this.userBehavior.connectionSpeed.effectiveType === '4g') {
            await this.lazyLoader.loadLibraries(['mediapipe_camera', 'mediapipe_pose']);
        } else {
            await this.lazyLoader.loadCriticalLibraries();
        }
    }

    // Adapt loading based on usage patterns
    adaptLoadingStrategy() {
        const preferences = this.userBehavior.preferredFeatures;
        
        if (preferences.includes('analysis')) {
            this.lazyLoader.loadLibrary('chartjs');
        }
        
        if (preferences.includes('export')) {
            this.lazyLoader.loadLibraries(['jspdf', 'html2canvas']);
        }
    }

    // Preload based on page visibility
    setupVisibilityBasedLoading() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Page is visible - safe to preload
                this.lazyLoader.preloadLibraries();
            }
        });
    }
}

// Global instance
const lazyLoader = new LazyLoader();
const smartLoader = new SmartLoadingStrategy(lazyLoader);

// Export for use in main app
window.LazyLoader = LazyLoader;
window.lazyLoader = lazyLoader;
window.smartLoader = smartLoader;

console.log('✅ Lazy Loading Manager ready'); 