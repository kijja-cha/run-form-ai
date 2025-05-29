// RunForm.AI - Global State Manager
// Centralizes all global state management

console.log('🗂️ Loading State Manager...');

const StateManager = {
    // Application state
    app: {
        isInitialized: false,
        currentStep: 1,
        debugMode: false
    },

    // Video state
    video: {
        current: null,
        duration: 0,
        quality: 'unknown',
        source: null // 'upload' | 'webcam'
    },

    // Camera state
    camera: {
        stream: null,
        isActive: false,
        mediaRecorder: null,
        recordedChunks: [],
        isRecording: false
    },

    // Analysis state
    analysis: {
        isRunning: false,
        data: [],
        progress: 0,
        status: 'idle', // 'idle' | 'initializing' | 'processing' | 'complete' | 'error'
        frameRate: 10,
        totalFrames: 0,
        processedFrames: 0
    },

    // MediaPipe state
    pose: {
        instance: null,
        isInitialized: false,
        config: {
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        }
    },

    // Performance state
    performance: {
        useWebWorkers: false,
        worker: null,
        optimizationLevel: 'auto', // 'auto' | 'high' | 'medium' | 'low'
        memoryUsage: 0,
        fps: 60
    },

    // UI state
    ui: {
        charts: {
            kneeAngle: null,
            torsoAngle: null
        },
        sections: {
            current: 'step1'
        },
        progress: {
            visible: false,
            text: '',
            percentage: 0
        }
    },

    // State setters with validation
    setState(path, value) {
        const keys = path.split('.');
        let current = this;
        
        // Navigate to parent
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        // Set value
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        // Emit change event
        this.emit('stateChanged', { path, oldValue, newValue: value });
        
        return value;
    },

    // State getters
    getState(path) {
        const keys = path.split('.');
        let current = this;
        
        for (const key of keys) {
            if (current[key] === undefined) {
                return undefined;
            }
            current = current[key];
        }
        
        return current;
    },

    // Convenience methods for common operations
    setVideoFile(file) {
        this.setState('video.current', file);
        this.setState('video.source', 'upload');
        this.setState('video.duration', file.duration || 0);
    },

    setWebcamStream(stream) {
        this.setState('camera.stream', stream);
        this.setState('camera.isActive', true);
        this.setState('video.source', 'webcam');
    },

    startAnalysis() {
        this.setState('analysis.isRunning', true);
        this.setState('analysis.status', 'initializing');
        this.setState('analysis.progress', 0);
        this.setState('analysis.data', []);
    },

    updateAnalysisProgress(processed, total, data = null) {
        this.setState('analysis.processedFrames', processed);
        this.setState('analysis.totalFrames', total);
        this.setState('analysis.progress', (processed / total) * 100);
        
        if (data) {
            const currentData = this.getState('analysis.data');
            currentData.push(data);
            this.setState('analysis.data', currentData);
        }
    },

    completeAnalysis() {
        this.setState('analysis.isRunning', false);
        this.setState('analysis.status', 'complete');
        this.setState('analysis.progress', 100);
    },

    failAnalysis(error) {
        this.setState('analysis.isRunning', false);
        this.setState('analysis.status', 'error');
        this.setState('analysis.error', error);
    },

    initializePose(poseInstance) {
        this.setState('pose.instance', poseInstance);
        this.setState('pose.isInitialized', true);
        // Store globally for compatibility
        window.pose = poseInstance;
    },

    resetApplication() {
        // Reset video
        this.setState('video.current', null);
        this.setState('video.duration', 0);
        this.setState('video.source', null);
        
        // Reset camera
        const stream = this.getState('camera.stream');
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        this.setState('camera.stream', null);
        this.setState('camera.isActive', false);
        this.setState('camera.isRecording', false);
        this.setState('camera.recordedChunks', []);
        
        // Reset analysis
        this.setState('analysis.isRunning', false);
        this.setState('analysis.data', []);
        this.setState('analysis.progress', 0);
        this.setState('analysis.status', 'idle');
        
        // Reset UI
        const charts = this.getState('ui.charts');
        if (charts.kneeAngle) {
            charts.kneeAngle.destroy();
            this.setState('ui.charts.kneeAngle', null);
        }
        if (charts.torsoAngle) {
            charts.torsoAngle.destroy();
            this.setState('ui.charts.torsoAngle', null);
        }
        
        this.setState('ui.sections.current', 'step1');
        this.setState('ui.progress.visible', false);
        
        // Emit reset event
        this.emit('appReset');
    },

    // Event system for state changes
    listeners: {},

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    },

    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    },

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    },

    // Debug helpers
    debugState() {
        console.group('🐛 RunForm.AI State Debug');
        console.log('App:', this.app);
        console.log('Video:', this.video);
        console.log('Camera:', this.camera);
        console.log('Analysis:', this.analysis);
        console.log('Pose:', this.pose);
        console.log('Performance:', this.performance);
        console.log('UI:', this.ui);
        console.groupEnd();
    },

    // Export state for debugging
    exportState() {
        return JSON.stringify({
            app: this.app,
            video: { ...this.video, current: this.video.current ? 'VideoElement' : null },
            camera: { ...this.camera, stream: this.camera.stream ? 'MediaStream' : null },
            analysis: this.analysis,
            pose: { ...this.pose, instance: this.pose.instance ? 'PoseInstance' : null },
            performance: { ...this.performance, worker: this.performance.worker ? 'Worker' : null },
            ui: this.ui
        }, null, 2);
    }
};

// Make available globally
window.StateManager = StateManager;

// Global state shortcuts for backward compatibility
Object.defineProperty(window, 'currentVideo', {
    get() { return StateManager.getState('video.current'); },
    set(value) { StateManager.setState('video.current', value); }
});

Object.defineProperty(window, 'analysisData', {
    get() { return StateManager.getState('analysis.data'); },
    set(value) { StateManager.setState('analysis.data', value); }
});

Object.defineProperty(window, 'isAnalyzing', {
    get() { return StateManager.getState('analysis.isRunning'); },
    set(value) { StateManager.setState('analysis.isRunning', value); }
});

console.log('✅ State Manager loaded successfully!'); 