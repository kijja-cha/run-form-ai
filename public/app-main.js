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

// Optimized analysis function
async function analyzeVideoOptimized() {
    if (!currentVideo) {
        alert('Please load a video first.');
        return;
    }

    // Check if required libraries are loaded
    if (!window.lazyLoader.isFeatureReady('analysis')) {
        console.log('📦 Loading analysis libraries...');
        await window.lazyLoader.loadOnDemand('analysis');
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
    
    // Adaptive frame rate based on device performance
    const baseFrameRate = window.DEMO_CONFIG?.PERFORMANCE?.TARGET_FPS || 10;
    const frameRate = optimizationSettings?.reduceQuality ? Math.max(5, baseFrameRate / 2) : baseFrameRate;
    
    totalFramesToProcess = Math.floor(duration * frameRate);

    // Set up canvas for processing
    outputCanvas.width = video.videoWidth || 640;
    outputCanvas.height = video.videoHeight || 480;

    try {
        if (isUsingWorkers && poseWorker) {
            // Use Web Worker for analysis
            await analyzeWithWorker(video, duration, frameRate);
        } else {
            // Fallback to main thread
            await analyzeWithMainThread(video, duration, frameRate);
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
        updateProgressOverlay(false);
        updateStatusIndicator(true, 'Analysis Failed', 'error');
        alert('Analysis failed. Please try again.');
        lightTracker.end('analysis');
    } finally {
        isAnalyzing = false;
    }
}

// Analyze with Web Worker
async function analyzeWithWorker(video, duration, frameRate) {
    console.log('🔧 Using Web Worker for analysis');
    
    // Extract frames and send to worker
    const frames = [];
    for (let i = 0; i < totalFramesToProcess; i++) {
        const currentTime = (i / frameRate);
        video.currentTime = currentTime;
        
        await new Promise((resolve) => {
            video.addEventListener('seeked', resolve, { once: true });
        });
        
        // Extract frame data
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        frames.push({ imageData, frameIndex: i });
    }
    
    // Send batch to worker
    poseWorker.postMessage({
        type: 'PROCESS_BATCH',
        data: { frames }
    });
    
    // Wait for completion
    return new Promise((resolve) => {
        const handler = (e) => {
            if (e.data.type === 'BATCH_COMPLETE') {
                poseWorker.removeEventListener('message', handler);
                resolve();
            }
        };
        poseWorker.addEventListener('message', handler);
    });
}

let totalFramesToProcess = 0;

// Analyze with main thread (fallback)
async function analyzeWithMainThread(video, duration, frameRate) {
    console.log('⚙️ Using main thread for analysis');
    
    // Ensure pose is initialized
    if (!pose) {
        await initializePose();
    }
    
    for (let i = 0; i < totalFramesToProcess; i++) {
        const currentTime = (i / frameRate);
        video.currentTime = currentTime;

        await new Promise((resolve) => {
            video.addEventListener('seeked', resolve, { once: true });
        });

        // Process frame with MediaPipe
        await pose.send({ image: video });

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
        await new Promise(resolve => setTimeout(resolve, 10));
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

// Initialize application with performance optimization
async function initializeApp() {
    console.log('🏃‍♂️ Initializing RunForm.AI Phase 2 with Performance Optimization...');
    lightTracker.start('app-init');
    
    // Get auto-optimization settings
    if (window.performanceMonitor) {
        optimizationSettings = window.performanceMonitor.autoOptimize();
        console.log('🎯 Auto-optimization settings:', optimizationSettings);
    }
    
    // Initialize Web Workers if supported and beneficial
    if (optimizationSettings?.enableWorkers) {
        await initializeWebWorkers();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize MediaPipe Pose (if not using workers)
    if (!isUsingWorkers) {
        await initializePose();
    }
    
    // Show initial section
    showSection(step1);
    
    lightTracker.end('app-init');
    console.log('✅ RunForm.AI Phase 2 with Performance Optimization initialized successfully!');
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('🎉 RunForm.AI Phase 2 - AI Personal Running Form Coach with Performance Optimization loaded!'); 