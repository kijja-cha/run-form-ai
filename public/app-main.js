// Main App Logic and Event Listeners - Performance Optimized
console.log('🚀 Starting RunForm.AI Main Application with Performance Optimizations...');

// Global variables for performance optimization
let poseWorker = null;
let isUsingWorkers = false;
let optimizationSettings = null;

// Event Listeners Setup
function setupEventListeners() {
    // Webcam button
    if (webcamBtn) {
        webcamBtn.addEventListener('click', startWebcam);
    }

    // Upload button
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            if (videoUpload) videoUpload.click();
        });
    }

    // Video upload
    if (videoUpload) {
        videoUpload.addEventListener('change', handleVideoUpload);
    }

    // Recording controls
    if (startRecordingBtn) {
        startRecordingBtn.addEventListener('click', startRecording);
    }

    if (stopRecordingBtn) {
        stopRecordingBtn.addEventListener('click', stopRecording);
    }

    // Analysis controls
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeVideoOptimized);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetApp);
    }

    // Export controls with lazy loading
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDFOptimized);
    }

    if (exportImageBtn) {
        exportImageBtn.addEventListener('click', exportToImageOptimized);
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', generateShareLink);
    }

    // Performance monitoring events
    setupPerformanceEventListeners();
}

// Setup performance event listeners
function setupPerformanceEventListeners() {
    // Listen for performance issues
    document.addEventListener('performance-issue', (event) => {
        const { type, data } = event.detail;
        console.warn(`⚠️ Performance issue detected: ${type}`, data);
        
        // Auto-optimize based on performance issues
        handlePerformanceIssue(type, data);
    });

    // Listen for library loading events
    document.addEventListener('library-loaded', (event) => {
        const { library, loadTime } = event.detail;
        console.log(`📦 Library ${library} loaded in ${loadTime.toFixed(2)}ms`);
        
        // Enable features as libraries become available
        enableFeatureWhenReady(library);
    });
}

// Handle performance issues automatically
function handlePerformanceIssue(type, data) {
    switch (type) {
        case 'memory-threshold-exceeded':
            console.log('🔧 Auto-optimization: Reducing memory usage');
            // Reduce processing quality
            if (window.DEMO_CONFIG) {
                window.DEMO_CONFIG.FRAME_INTERVAL = Math.min(0.2, window.DEMO_CONFIG.FRAME_INTERVAL * 2);
            }
            break;
            
        case 'low-fps':
            console.log('🔧 Auto-optimization: Reducing animations');
            // Disable non-essential animations
            document.body.style.setProperty('--transition', 'none');
            break;
            
        case 'slow-load':
            console.log('🔧 Auto-optimization: Prioritizing critical features');
            // Focus on critical features only
            break;
    }
}

// Enable features when libraries are ready
function enableFeatureWhenReady(library) {
    switch (library) {
        case 'mediapipe_pose':
            // Enable analysis when MediaPipe is ready
            if (analyzeBtn && currentVideo) {
                analyzeBtn.disabled = false;
            }
            break;
            
        case 'chartjs':
            // Charts can now be generated
            console.log('📊 Chart.js ready for interactive charts');
            break;
            
        case 'jspdf':
        case 'html2canvas':
            // Export features are ready
            console.log('📄 Export features ready');
            break;
    }
}

// Initialize Web Workers
async function initializeWebWorkers() {
    if (!window.Worker) {
        console.warn('⚠️ Web Workers not supported - using main thread');
        return false;
    }

    try {
        // Check if we should use workers based on device capabilities
        const optimization = window.performanceMonitor?.autoOptimize();
        if (!optimization?.enableWorkers) {
            console.log('💡 Device capabilities suggest main thread processing');
            return false;
        }

        poseWorker = new Worker('/workers/pose-analysis-worker.js');
        
        poseWorker.onmessage = function(e) {
            const { type, data, frameIndex } = e.data;
            
            switch (type) {
                case 'POSE_INITIALIZED':
                    console.log('✅ Pose worker initialized');
                    isUsingWorkers = true;
                    break;
                    
                case 'FRAME_RESULT':
                    handleWorkerFrameResult(data, frameIndex);
                    break;
                    
                case 'BATCH_PROGRESS':
                    updateProgressFromWorker(data);
                    break;
                    
                case 'ERROR':
                    console.error('❌ Worker error:', data.error);
                    fallbackToMainThread();
                    break;
            }
        };

        poseWorker.onerror = function(error) {
            console.error('❌ Worker failed:', error);
            fallbackToMainThread();
        };

        // Initialize pose in worker
        poseWorker.postMessage({
            type: 'INIT_POSE',
            data: {
                config: window.DEMO_CONFIG?.MEDIAPIPE_CONFIG
            }
        });

        console.log('🔧 Web Worker initialized for pose analysis');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to initialize workers:', error);
        return false;
    }
}

// Handle worker frame results
function handleWorkerFrameResult(data, frameIndex) {
    if (data && data.analysis) {
        // Update analysis data from worker
        analysisData[frameIndex] = data.analysis;
        
        // Update progress
        const progress = ((frameIndex + 1) / totalFramesToProcess) * 100;
        updateProgressOverlay(
            true,
            `Processing frame ${frameIndex + 1}...`,
            progress,
            frameIndex + 1,
            analysisData.filter(f => f && f.issues.length > 0).length,
            'High Quality'
        );
        
        // Draw pose if we have landmarks
        if (data.landmarks) {
            drawEnhancedPoseLandmarks(data.landmarks);
        }
    }
}

// Update progress from worker
function updateProgressFromWorker(data) {
    updateProgressOverlay(
        true,
        `Processing batch: ${data.current}/${data.total}`,
        data.percentage,
        data.current,
        analysisData.filter(f => f && f.issues.length > 0).length,
        'Processing...'
    );
}

// Fallback to main thread processing
function fallbackToMainThread() {
    console.log('🔄 Falling back to main thread processing');
    isUsingWorkers = false;
    if (poseWorker) {
        poseWorker.terminate();
        poseWorker = null;
    }
}

// Webcam functionality with lazy loading
async function startWebcam() {
    try {
        console.log('📹 Starting webcam...');
        lightTracker.start('webcam-setup');
        
        // Load camera libraries on demand
        await window.lazyLoader.loadOnDemand('webcam');
        
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment'
            }
        });

        if (webcamElement) {
            webcamElement.srcObject = stream;
            webcamElement.play();
        }

        if (cameraSection) cameraSection.style.display = 'block';
        showSection(step2);

        // Initialize camera for MediaPipe (if using main thread)
        if (!isUsingWorkers && pose && typeof Camera !== 'undefined') {
            camera = new Camera(webcamElement, {
                onFrame: async () => {
                    if (pose && webcamElement.readyState === 4) {
                        await pose.send({ image: webcamElement });
                    }
                },
                width: 1280,
                height: 720
            });
            camera.start();
        }

        updateStatusIndicator(true, 'Camera Active', 'processing');
        lightTracker.end('webcam-setup');

    } catch (error) {
        console.error('❌ Webcam access failed:', error);
        lightTracker.end('webcam-setup');
        alert('Could not access camera. Please check permissions and try again.');
    }
}

// Video upload functionality
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 Processing uploaded video...');
    lightTracker.start('video-upload');

    // Check file size and optimize if needed
    const maxSize = window.DEMO_CONFIG?.MAX_VIDEO_SIZE || 100 * 1024 * 1024;
    if (file.size > maxSize) {
        console.warn(`⚠️ Large video file: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        // Could implement video compression here
    }

    if (inputVideoElement) {
        const url = URL.createObjectURL(file);
        inputVideoElement.src = url;
        inputVideoElement.load();

        inputVideoElement.addEventListener('loadedmetadata', () => {
            currentVideo = inputVideoElement;
            updateVideoInfo(inputVideoElement);
            
            if (videoPreviewSection) videoPreviewSection.style.display = 'block';
            if (analyzeBtn && window.lazyLoader.isFeatureReady('analysis')) {
                analyzeBtn.disabled = false;
            }
            
            showSection(step2);
            updateStatusIndicator(true, 'Video Loaded', 'complete');
            lightTracker.end('video-upload');
        });

        inputVideoElement.addEventListener('error', () => {
            alert('Error loading video. Please try a different file.');
            lightTracker.end('video-upload');
        });
    }
}

// Recording functionality
function startRecording() {
    if (!webcamElement || !webcamElement.srcObject) return;

    try {
        lightTracker.start('recording');
        recordedChunks = [];
        const stream = webcamElement.srcObject;
        
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });

        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener('stop', () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            
            if (inputVideoElement) {
                inputVideoElement.src = url;
                inputVideoElement.load();
                
                inputVideoElement.addEventListener('loadedmetadata', () => {
                    currentVideo = inputVideoElement;
                    updateVideoInfo(inputVideoElement);
                    
                    if (videoPreviewSection) videoPreviewSection.style.display = 'block';
                    if (analyzeBtn && window.lazyLoader.isFeatureReady('analysis')) {
                        analyzeBtn.disabled = false;
                    }
                    
                    updateStatusIndicator(true, 'Recording Complete', 'complete');
                    lightTracker.end('recording');
                });
            }
        });

        mediaRecorder.start(100);
        isRecording = true;

        if (startRecordingBtn) startRecordingBtn.style.display = 'none';
        if (stopRecordingBtn) stopRecordingBtn.style.display = 'inline-flex';
        if (document.getElementById('recordingIndicator')) {
            document.getElementById('recordingIndicator').style.display = 'flex';
        }

        updateStatusIndicator(true, 'Recording...', 'processing');

    } catch (error) {
        console.error('❌ Recording failed:', error);
        lightTracker.end('recording');
        alert('Recording failed. Please try again.');
    }
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;

        if (startRecordingBtn) startRecordingBtn.style.display = 'inline-flex';
        if (stopRecordingBtn) stopRecordingBtn.style.display = 'none';
        if (document.getElementById('recordingIndicator')) {
            document.getElementById('recordingIndicator').style.display = 'none';
        }
    }
}

// Initialize application with performance optimization
async function initializeApp() {
    console.log('🏃‍♂️ Initializing RunForm.AI Phase 2 with Performance Optimization...');
    lightTracker.start('app-init');
    
    // Get auto-optimization settings
    if (window.performanceMonitor) {
        optimizationSettings = window.performanceMonitor.autoOptimize();
        console.log('🎯 Auto-optimization settings:', optimizationSettings);
    }
    
    // Force load critical libraries immediately for stability
    try {
        console.log('📦 Force loading critical MediaPipe libraries...');
        await window.lazyLoader.loadOnDemand('analysis');
        console.log('✅ Critical libraries loaded successfully');
        
        // Verify libraries are actually available
        if (typeof Pose === 'undefined') {
            console.warn('⚠️ Pose not available after loading, trying fallback...');
            await loadLibrariesFallback();
        }
        
    } catch (error) {
        console.warn('⚠️ Failed to load libraries via lazy loader, using fallback', error);
        // Fallback: Load libraries the old way
        await loadLibrariesFallback();
    }
    
    // Wait a bit for libraries to be fully available
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Initialize Web Workers if supported and beneficial (but not required)
    if (optimizationSettings?.enableWorkers) {
        try {
            const workerSuccess = await initializeWebWorkers();
            if (!workerSuccess) {
                console.log('💡 Web Workers not initialized, using main thread');
            }
        } catch (error) {
            console.warn('⚠️ Web Workers failed, continuing with main thread', error);
            isUsingWorkers = false;
        }
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Always initialize MediaPipe Pose on main thread as backup
    try {
        console.log('🔧 Initializing MediaPipe Pose...');
        await initializePoseGlobal();
        console.log('✅ MediaPipe Pose initialized on main thread');
    } catch (error) {
        console.error('❌ Failed to initialize MediaPipe Pose:', error);
        console.log('💡 Will retry initialization when analysis starts');
    }
    
    // Show initial section
    showSection(step1);
    
    lightTracker.end('app-init');
    console.log('✅ RunForm.AI Phase 2 with Performance Optimization initialized successfully!');
}

// New function to properly initialize pose globally
async function initializePoseGlobal() {
    console.log('🔧 initializePoseGlobal called');
    
    // Check if libraries are available
    if (typeof Pose === 'undefined') {
        console.log('📦 Pose not available, loading libraries...');
        await loadLibrariesFallback();
        
        // Wait a bit more for libraries to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (typeof Pose === 'undefined') {
            throw new Error('MediaPipe Pose library not available after loading');
        }
    }
    
    console.log('🔧 Creating Pose instance...');
    console.log('🔧 Pose constructor available:', typeof Pose);
    
    try {
        // Create pose instance with proper configuration
        window.pose = new Pose({
            locateFile: (file) => {
                const url = `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                console.log(`📥 MediaPipe loading file: ${url}`);
                return url;
            }
        });

        console.log('✅ Pose instance created:', typeof window.pose);

        // Configure pose options
        window.pose.setOptions({
            modelComplexity: 1, // Reduced from 2 for better stability
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
            selfieMode: false
        });

        console.log('✅ Pose options set successfully');

        // Set up pose results handler
        if (typeof onPoseResults === 'function') {
            window.pose.onResults(onPoseResults);
            console.log('✅ onPoseResults handler attached');
        } else {
            console.error('❌ onPoseResults function not available');
            throw new Error('onPoseResults function not available');
        }
        
        console.log('✅ Global pose instance created and configured successfully');
        
        // Test the pose instance
        console.log('🧪 Testing pose instance methods...');
        console.log('- setOptions:', typeof window.pose.setOptions);
        console.log('- send:', typeof window.pose.send);
        console.log('- onResults:', typeof window.pose.onResults);
        
        return window.pose;
        
    } catch (error) {
        console.error('❌ Error creating pose instance:', error);
        window.pose = null;
        throw error;
    }
}

// Make function globally available for debug
window.initializePoseGlobal = initializePoseGlobal;

// Fallback library loading function
async function loadLibrariesFallback() {
    console.log('🔄 Loading libraries with fallback method...');
    
    const libraries = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js'
    ];
    
    for (const lib of libraries) {
        try {
            await loadScript(lib);
            console.log(`✅ Loaded: ${lib}`);
        } catch (error) {
            console.error(`❌ Failed to load: ${lib}`, error);
        }
    }
}

// Helper function to load script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.crossOrigin = 'anonymous';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Optimized analysis function with better error handling
async function analyzeVideoOptimized() {
    if (!currentVideo) {
        alert('Please load a video first.');
        return;
    }

    console.log('🔍 Starting enhanced analysis with performance optimization...');
    lightTracker.start('analysis');
    
    // Dispatch analysis started event for performance monitoring
    document.dispatchEvent(new CustomEvent('analysis-started'));
    
    isAnalyzing = true;
    analysisData = [];
    
    // Clear previous results
    if (snapshotsGrid) snapshotsGrid.innerHTML = '';
    if (coachingContent) coachingContent.innerHTML = '';
    if (dataQualityContent) dataQualityContent.innerHTML = '';

    // Show progress
    updateProgressOverlay(true, 'Initializing AI pose detection...', 0);
    showSection(step3);

    const video = currentVideo;
    const duration = video.duration;
    
    // Restore normal frame rate - this was the issue!
    const frameRate = 10; // Back to 10 FPS for proper analysis
    totalFramesToProcess = Math.floor(duration * frameRate);

    console.log(`📊 Processing ${totalFramesToProcess} frames at ${frameRate} FPS`);

    // Set up canvas for processing
    outputCanvas.width = video.videoWidth || 640;
    outputCanvas.height = video.videoHeight || 480;

    try {
        // Always use main thread for now (more stable)
        console.log('⚙️ Using main thread analysis for stability');
        
        // Ensure pose is initialized and available
        if (!window.pose) {
            console.log('🔧 Global pose not found, initializing...');
            await initializePoseGlobal();
            
            // Wait a bit for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!window.pose) {
            throw new Error('MediaPipe Pose not available after initialization');
        }
        
        console.log('✅ Pose instance confirmed, starting analysis...');
        console.log('🔧 Pose instance type:', typeof window.pose);
        console.log('🔧 Pose send function:', typeof window.pose.send);
        
        // Reset analysis data
        analysisData = [];
        
        // Process frames on main thread
        for (let i = 0; i < totalFramesToProcess; i++) {
            const currentTime = (i / frameRate);
            video.currentTime = currentTime;

            await new Promise((resolve) => {
                video.addEventListener('seeked', resolve, { once: true });
            });

            console.log(`🔄 Processing frame ${i + 1}/${totalFramesToProcess} at time ${currentTime.toFixed(2)}s`);

            // Process frame with MediaPipe
            try {
                await window.pose.send({ image: video });
                console.log(`✅ Frame ${i + 1} sent to MediaPipe successfully`);
            } catch (frameError) {
                console.error(`❌ Error processing frame ${i + 1}:`, frameError);
            }

            // Update progress
            const progress = ((i + 1) / totalFramesToProcess) * 100;
            const currentInsights = analysisData.reduce((sum, frame) => sum + (frame?.issues?.length || 0), 0);
            
            updateProgressOverlay(
                true,
                `Analyzing frame ${i + 1} of ${totalFramesToProcess}...`,
                progress,
                i + 1,
                currentInsights,
                progress > 50 ? 'High Quality' : 'Building...'
            );

            // Add small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 30));
        }

        console.log(`📊 Analysis completed. Data points collected: ${analysisData.length}`);

        // Verify we have analysis data
        if (analysisData.length === 0) {
            throw new Error('No analysis data generated - pose detection may have failed. Check if person is clearly visible in video.');
        }

        // Generate comprehensive results
        console.log('📊 Generating comprehensive analysis...');
        await generateAllResults();

        // Dispatch analysis completed event
        document.dispatchEvent(new CustomEvent('analysis-completed'));

        // Hide progress and show results
        setTimeout(() => {
            updateProgressOverlay(false);
            updateStatusIndicator(true, 'Analysis Complete', 'complete');
            lightTracker.end('analysis');
        }, 1000);

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        
        // Enhanced error reporting with more specific guidance
        let errorMessage = 'Analysis failed. ';
        if (error.message.includes('MediaPipe') || error.message.includes('Pose')) {
            errorMessage += 'MediaPipe Pose detection failed. ';
        } else if (error.message.includes('analysis data')) {
            errorMessage += 'No pose data detected in video. ';
        } else if (error.message.includes('visible')) {
            errorMessage += 'Person not clearly visible in video. ';
        }
        
        errorMessage += '\n\nTroubleshooting steps:\n';
        errorMessage += '1. Ensure person is clearly visible throughout video\n';
        errorMessage += '2. Use Clear Cache in debug panel\n';
        errorMessage += '3. Try Force Reload\n';
        errorMessage += '4. Check video quality and lighting\n';
        errorMessage += '5. Make sure full body is in frame';
        
        updateProgressOverlay(false);
        updateStatusIndicator(true, 'Analysis Failed', 'error');
        alert(errorMessage);
        lightTracker.end('analysis');
    } finally {
        isAnalyzing = false;
    }
}

// Optimized PDF export with lazy loading
async function exportToPDFOptimized() {
    // Load export libraries on demand
    if (!window.lazyLoader.isFeatureReady('export')) {
        console.log('📦 Loading export libraries...');
        await window.lazyLoader.loadOnDemand('export');
    }
    
    lightTracker.start('pdf-export');
    await exportToPDF();
    lightTracker.end('pdf-export');
}

// Optimized image export with lazy loading
async function exportToImageOptimized() {
    // Load export libraries on demand
    if (!window.lazyLoader.isFeatureReady('export')) {
        console.log('📦 Loading export libraries...');
        await window.lazyLoader.loadOnDemand('export');
    }
    
    lightTracker.start('image-export');
    await exportToImage();
    lightTracker.end('image-export');
}

// Generate all Phase 2 results with performance optimization
async function generateAllResults() {
    lightTracker.start('results-generation');
    
    // Load charts library if needed
    if (!window.lazyLoader.isFeatureReady('charts')) {
        await window.lazyLoader.loadOnDemand('charts');
    }
    
    // 1. Generate basic metrics overview
    generateMetricsOverview();
    
    // 2. Create interactive charts (if Chart.js is loaded)
    if (typeof Chart !== 'undefined') {
        createInteractiveCharts();
    }
    
    // 3. Generate frame snapshots
    generateFrameSnapshots();
    
    // 4. Create coaching insights
    generateCoachingInsights();
    
    // 5. Generate data quality report
    generateDataQualityReport();
    
    // 6. Generate traditional feedback
    generateDetailedFeedback();
    
    lightTracker.end('results-generation');
}

// Reset application with cleanup
function resetApp() {
    console.log('🔄 Resetting application...');
    lightTracker.start('reset');
    
    // Stop camera and recording
    if (camera) camera.stop();
    if (mediaRecorder && isRecording) stopRecording();
    
    // Clean up Web Worker
    if (poseWorker && isUsingWorkers) {
        poseWorker.postMessage({ type: 'CLEANUP' });
    }
    
    // Reset video elements
    if (webcamElement && webcamElement.srcObject) {
        webcamElement.srcObject.getTracks().forEach(track => track.stop());
        webcamElement.srcObject = null;
    }
    
    if (inputVideoElement) {
        inputVideoElement.src = '';
    }

    // Reset variables
    currentVideo = null;
    analysisData = [];
    isAnalyzing = false;
    isRecording = false;

    // Destroy charts
    if (kneeAngleChart) {
        kneeAngleChart.destroy();
        kneeAngleChart = null;
    }
    if (torsoAngleChart) {
        torsoAngleChart.destroy();
        torsoAngleChart = null;
    }

    // Clear content
    if (snapshotsGrid) snapshotsGrid.innerHTML = '';
    if (coachingContent) coachingContent.innerHTML = '';
    if (dataQualityContent) dataQualityContent.innerHTML = '';
    if (document.getElementById('feedbackContent')) {
        document.getElementById('feedbackContent').innerHTML = '';
    }

    // Hide sections
    if (cameraSection) cameraSection.style.display = 'none';
    if (videoPreviewSection) videoPreviewSection.style.display = 'none';
    
    // Reset UI
    updateProgressOverlay(false);
    updateStatusIndicator(false);
    showSection(step1);
    
    if (analyzeBtn) analyzeBtn.disabled = true;
    
    // Performance cleanup
    if (window.performanceMonitor) {
        // Reset memory warning flag
        window.performanceMonitor.memoryWarningShown = false;
    }
    
    lightTracker.end('reset');
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('🎉 RunForm.AI Phase 2 - AI Personal Running Form Coach with Performance Optimization loaded!'); 