// RunForm.AI - Performance Monitor
// Tracks and optimizes application performance

console.log('📊 Performance Monitor initialized');

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            memory: [],
            fps: [],
            loadTimes: {},
            userTiming: {},
            networkRequests: [],
            errors: []
        };
        
        this.thresholds = {
            maxMemory: 150 * 1024 * 1024, // 150MB
            minFPS: 30,
            maxLoadTime: 3000, // 3 seconds
            maxProcessingTime: 5000 // 5 seconds
        };
        
        this.isMonitoring = false;
        this.reportInterval = null;
        this.memoryWarningShown = false;
        
        this.setupEventListeners();
        this.startMonitoring();
    }

    // Start performance monitoring
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🔍 Performance monitoring started');
        
        // Monitor memory usage every 5 seconds
        this.reportInterval = setInterval(() => {
            this.collectMemoryMetrics();
            this.checkPerformanceThresholds();
        }, 5000);
        
        // Monitor FPS
        this.startFPSMonitoring();
        
        // Monitor network requests
        this.setupNetworkMonitoring();
        
        // Monitor errors
        this.setupErrorTracking();
    }

    // Stop monitoring
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        console.log('⏹️ Performance monitoring stopped');
        
        if (this.reportInterval) {
            clearInterval(this.reportInterval);
            this.reportInterval = null;
        }
    }

    // Collect memory metrics
    collectMemoryMetrics() {
        if (!performance.memory) return;
        
        const memory = {
            timestamp: Date.now(),
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
        };
        
        this.metrics.memory.push(memory);
        
        // Keep only last 100 entries
        if (this.metrics.memory.length > 100) {
            this.metrics.memory.shift();
        }
        
        // Check memory warnings
        this.checkMemoryUsage(memory);
    }

    // Monitor FPS
    startFPSMonitoring() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const measureFPS = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                this.metrics.fps.push({
                    timestamp: currentTime,
                    fps: fps
                });
                
                // Keep only last 60 entries (1 minute at 1 FPS)
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            if (this.isMonitoring) {
                requestAnimationFrame(measureFPS);
            }
        };
        
        requestAnimationFrame(measureFPS);
    }

    // Setup network monitoring
    setupNetworkMonitoring() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                this.recordNetworkRequest({
                    url,
                    duration: endTime - startTime,
                    status: response.status,
                    success: response.ok
                });
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                this.recordNetworkRequest({
                    url,
                    duration: endTime - startTime,
                    error: error.message,
                    success: false
                });
                
                throw error;
            }
        };
    }

    // Record network request
    recordNetworkRequest(request) {
        this.metrics.networkRequests.push({
            ...request,
            timestamp: Date.now()
        });
        
        // Keep only last 50 requests
        if (this.metrics.networkRequests.length > 50) {
            this.metrics.networkRequests.shift();
        }
    }

    // Setup error tracking
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack
            });
        });
    }

    // Record error
    recordError(error) {
        this.metrics.errors.push({
            ...error,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        
        console.error('📊 Performance Monitor - Error recorded:', error);
        
        // Keep only last 20 errors
        if (this.metrics.errors.length > 20) {
            this.metrics.errors.shift();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Monitor page load time
        window.addEventListener('load', () => {
            const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
            this.metrics.loadTimes.pageLoad = loadTime;
            console.log(`📄 Page load time: ${loadTime}ms`);
        });
        
        // Monitor library loads
        document.addEventListener('library-loaded', (event) => {
            const { library, loadTime } = event.detail;
            this.metrics.loadTimes[library] = loadTime;
            console.log(`📦 ${library} load time: ${loadTime.toFixed(2)}ms`);
        });
        
        // Monitor analysis performance
        document.addEventListener('analysis-started', () => {
            this.startTiming('analysis');
        });
        
        document.addEventListener('analysis-completed', () => {
            const duration = this.endTiming('analysis');
            console.log(`🔍 Analysis completed in ${duration.toFixed(2)}ms`);
        });
    }

    // Start timing measurement
    startTiming(name) {
        this.metrics.userTiming[name] = {
            start: performance.now(),
            end: null,
            duration: null
        };
    }

    // End timing measurement
    endTiming(name) {
        if (!this.metrics.userTiming[name]) {
            console.warn(`No timing started for: ${name}`);
            return 0;
        }
        
        const timing = this.metrics.userTiming[name];
        timing.end = performance.now();
        timing.duration = timing.end - timing.start;
        
        return timing.duration;
    }

    // Check memory usage
    checkMemoryUsage(memory) {
        const usagePercent = (memory.used / memory.limit) * 100;
        
        if (usagePercent > 80 && !this.memoryWarningShown) {
            this.memoryWarningShown = true;
            this.showMemoryWarning(usagePercent);
            this.suggestOptimizations();
        }
        
        if (memory.used > this.thresholds.maxMemory) {
            this.dispatchPerformanceEvent('memory-threshold-exceeded', {
                current: memory.used,
                threshold: this.thresholds.maxMemory
            });
        }
    }

    // Check performance thresholds
    checkPerformanceThresholds() {
        // Check FPS
        const recentFPS = this.metrics.fps.slice(-5);
        if (recentFPS.length > 0) {
            const avgFPS = recentFPS.reduce((sum, item) => sum + item.fps, 0) / recentFPS.length;
            
            if (avgFPS < this.thresholds.minFPS) {
                this.dispatchPerformanceEvent('low-fps', { current: avgFPS, threshold: this.thresholds.minFPS });
            }
        }
        
        // Check load times
        Object.entries(this.metrics.loadTimes).forEach(([name, time]) => {
            if (time > this.thresholds.maxLoadTime) {
                this.dispatchPerformanceEvent('slow-load', { library: name, time, threshold: this.thresholds.maxLoadTime });
            }
        });
    }

    // Show memory warning
    showMemoryWarning(usagePercent) {
        console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(1)}%`);
        
        // Create non-intrusive warning
        const warning = document.createElement('div');
        warning.className = 'performance-warning';
        warning.innerHTML = `
            <div style="position: fixed; bottom: 20px; right: 20px; background: rgba(255, 152, 0, 0.9); color: white; padding: 12px 16px; border-radius: 8px; font-size: 14px; z-index: 1000; max-width: 300px;">
                ⚠️ High memory usage detected (${usagePercent.toFixed(1)}%)
                <br><small>Consider refreshing if performance feels slow</small>
                <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; float: right; cursor: pointer; padding: 0; margin-left: 8px;">×</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 10000);
    }

    // Suggest optimizations
    suggestOptimizations() {
        const suggestions = [];
        
        const currentMemory = this.getCurrentMemoryUsage();
        if (currentMemory > 100 * 1024 * 1024) { // > 100MB
            suggestions.push('Consider reducing video quality or duration');
        }
        
        const avgFPS = this.getAverageFPS();
        if (avgFPS < 30) {
            suggestions.push('Reduce video processing complexity');
        }
        
        if (suggestions.length > 0) {
            console.log('💡 Performance suggestions:', suggestions);
        }
    }

    // Dispatch performance events
    dispatchPerformanceEvent(type, data) {
        const event = new CustomEvent('performance-issue', {
            detail: { type, data, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // Get current memory usage
    getCurrentMemoryUsage() {
        if (!performance.memory) return 0;
        return performance.memory.usedJSHeapSize;
    }

    // Get average FPS
    getAverageFPS() {
        if (this.metrics.fps.length === 0) return 60;
        
        const recent = this.metrics.fps.slice(-10);
        return recent.reduce((sum, item) => sum + item.fps, 0) / recent.length;
    }

    // Get performance report
    getPerformanceReport() {
        const currentMemory = this.getCurrentMemoryUsage();
        const avgFPS = this.getAverageFPS();
        const totalLoadTime = Object.values(this.metrics.loadTimes)
            .reduce((sum, time) => sum + time, 0);
        
        return {
            memory: {
                current: currentMemory,
                peak: Math.max(...this.metrics.memory.map(m => m.used), currentMemory),
                samples: this.metrics.memory.length
            },
            fps: {
                current: avgFPS,
                samples: this.metrics.fps.length
            },
            loadTimes: { ...this.metrics.loadTimes },
            totalLoadTime,
            networkRequests: this.metrics.networkRequests.length,
            errors: this.metrics.errors.length,
            timestamp: Date.now()
        };
    }

    // Export metrics for analysis
    exportMetrics() {
        const report = this.getPerformanceReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `runform-performance-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Optimize based on device capabilities
    autoOptimize() {
        const memory = this.getCurrentMemoryUsage();
        const fps = this.getAverageFPS();
        
        const optimizations = {
            reduceQuality: false,
            enableLazyLoading: false,
            reduceAnimations: false,
            enableWorkers: false
        };
        
        // Memory-based optimizations
        if (memory > 100 * 1024 * 1024) { // > 100MB
            optimizations.reduceQuality = true;
            optimizations.enableLazyLoading = true;
        }
        
        // FPS-based optimizations
        if (fps < 30) {
            optimizations.reduceAnimations = true;
        }
        
        // Enable workers on capable devices
        if (typeof Worker !== 'undefined' && memory < 200 * 1024 * 1024) {
            optimizations.enableWorkers = true;
        }
        
        console.log('🎯 Auto-optimization suggestions:', optimizations);
        return optimizations;
    }
}

// Lightweight performance tracker for minimal overhead
class LightweightTracker {
    constructor() {
        this.startTimes = new Map();
    }
    
    start(name) {
        this.startTimes.set(name, performance.now());
    }
    
    end(name) {
        const startTime = this.startTimes.get(name);
        if (!startTime) return 0;
        
        const duration = performance.now() - startTime;
        this.startTimes.delete(name);
        
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
        return duration;
    }
}

// Global instances
const performanceMonitor = new PerformanceMonitor();
const lightTracker = new LightweightTracker();

// Export for use in main app
window.PerformanceMonitor = PerformanceMonitor;
window.performanceMonitor = performanceMonitor;
window.lightTracker = lightTracker;

console.log('✅ Performance Monitor ready'); 