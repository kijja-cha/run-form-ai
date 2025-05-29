class RunFormAnalyzer {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.currentVideo = null;
        this.currentVideoURL = null;
        this.analysisResults = [];
        this.frameCount = 0;
        this.tipIndex = 0;
        
        this.initializeElements();
        this.initializeMediaPipe();
        this.setupEventListeners();
        this.startTipRotation();
    }

    initializeElements() {
        // Get DOM elements
        this.webcamBtn = document.getElementById('webcamBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.videoUpload = document.getElementById('videoUpload');
        this.cameraSection = document.getElementById('cameraSection');
        this.webcam = document.getElementById('webcam');
        this.startRecording = document.getElementById('startRecording');
        this.stopRecording = document.getElementById('stopRecording');
        this.inputVideo = document.getElementById('inputVideo');
        this.outputCanvas = document.getElementById('outputCanvas');
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.feedbackSection = document.getElementById('feedbackSection');
        this.feedbackContent = document.getElementById('feedbackContent');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.progressSection = document.getElementById('progressSection');
        this.progressBar = document.getElementById('progressBar');
        this.rotatingTip = document.getElementById('rotatingTip');

        // Enhanced UI elements
        this.analysisStatus = document.getElementById('analysisStatus');
        this.videoControls = document.getElementById('videoControls');
        this.frameInfo = document.getElementById('frameInfo');
        this.progressText = document.getElementById('progressText');
        this.framesProcessed = document.getElementById('framesProcessed');
        this.issuesDetected = document.getElementById('issuesDetected');
        this.currentQuality = document.getElementById('currentQuality');

        // Interactive controls
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.stepBackBtn = document.getElementById('stepBackBtn');
        this.stepForwardBtn = document.getElementById('stepForwardBtn');
        this.slowMotionBtn = document.getElementById('slowMotionBtn');

        // Set up canvas context with error handling
        if (this.outputCanvas) {
            this.canvasCtx = this.outputCanvas.getContext('2d');
            if (!this.canvasCtx) {
                console.error('Failed to get 2D context from canvas');
                this.showError('Canvas not supported in this browser');
            }
        } else {
            console.error('Output canvas element not found');
        }
    }

    async initializeMediaPipe() {
        try {
            // Check if MediaPipe dependencies are loaded
            if (typeof Pose === 'undefined') {
                throw new Error('MediaPipe Pose library not loaded. Please check your internet connection.');
            }

            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            // Desktop-optimized configuration for best accuracy
            const config = window.DEMO_CONFIG?.MEDIAPIPE_CONFIG || {
                modelComplexity: 2, // Highest complexity for best accuracy
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.7, // Higher confidence for accuracy
                minTrackingConfidence: 0.7,
                staticImageMode: false,
                upperBodyOnly: false
            };

            this.pose.setOptions(config);
            this.pose.onResults(this.onPoseResults.bind(this));
            
            // Hide MediaPipe loading overlay
            const mediapipeLoading = document.getElementById('mediapipeLoading');
            if (mediapipeLoading) {
                mediapipeLoading.style.display = 'none';
            }
            
            console.log('MediaPipe Pose initialized for desktop with highest accuracy settings');
        } catch (error) {
            console.error('Error initializing MediaPipe:', error);
            
            // Update loading overlay to show error
            const mediapipeLoading = document.getElementById('mediapipeLoading');
            if (mediapipeLoading) {
                const errorMessage = 'Please check your internet connection and refresh the page. For best results, use Chrome or Firefox on desktop.';
                    
                mediapipeLoading.innerHTML = `
                    <div class="loading-content">
                        <div style="color: #dc3545; font-size: 48px;">⚠️</div>
                        <p style="color: #dc3545; font-weight: bold;">Failed to Load MediaPipe</p>
                        <p style="color: #6c757d;">${errorMessage}</p>
                        <button onclick="location.reload()" style="
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                            margin-top: 10px;
                        ">Refresh Page</button>
                    </div>
                `;
            }
            
            this.showError('Failed to initialize pose detection. ' + (error.message || 'Please try using Chrome or Firefox for best results.'));
        }
    }

    setupEventListeners() {
        this.webcamBtn.addEventListener('click', this.startWebcam.bind(this));
        this.uploadBtn.addEventListener('click', () => this.videoUpload.click());
        this.videoUpload.addEventListener('change', this.handleVideoUpload.bind(this));
        this.startRecording.addEventListener('click', this.startVideoRecording.bind(this));
        this.stopRecording.addEventListener('click', this.stopVideoRecording.bind(this));
        this.analyzeBtn.addEventListener('click', this.analyzeVideo.bind(this));
        this.resetBtn.addEventListener('click', this.reset.bind(this));
        this.exportBtn.addEventListener('click', this.exportResults.bind(this));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.reset();
            } else if (e.key === ' ' && this.analyzeBtn && !this.analyzeBtn.disabled) {
                e.preventDefault();
                this.analyzeVideo();
            }
        });
    }

    startTipRotation() {
        const tips = window.DEMO_CONFIG?.TIPS || [
            "💡 Record from the side view for best results",
            "📱 Hold your camera horizontally",
            "🏃‍♂️ Ensure good lighting for better detection",
            "📏 Stand 6-10 feet away from camera",
            "⏱️ Record 10-20 seconds of running",
            "🎯 Keep your full body in frame throughout the video",
            "🖥️ Use Chrome or Firefox for optimal performance",
            "📹 Higher resolution videos provide better analysis"
        ];

        setInterval(() => {
            if (this.rotatingTip) {
                this.tipIndex = (this.tipIndex + 1) % tips.length;
                this.rotatingTip.textContent = tips[this.tipIndex];
            }
        }, 4000);
    }

    async startWebcam() {
        try {
            // Check if Camera API is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera API not supported in this browser');
            }

            // Check if Camera class is available (MediaPipe dependency)
            if (typeof Camera === 'undefined') {
                throw new Error('MediaPipe Camera utility not loaded');
            }

            const config = window.DEMO_CONFIG?.CAMERA_CONFIG || { width: 640, height: 480 };
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: config
            });
            
            this.webcam.srcObject = stream;
            this.cameraSection.style.display = 'block';
            
            this.camera = new Camera(this.webcam, {
                onFrame: async () => {
                    if (this.pose) {
                        await this.pose.send({ image: this.webcam });
                    }
                },
                width: config.width,
                height: config.height
            });
            
            this.camera.start();
        } catch (error) {
            console.error('Error accessing webcam:', error);
            this.showError('Unable to access camera. Please check permissions and ensure no other applications are using the camera.');
        }
    }

    async startVideoRecording() {
        try {
            const stream = this.webcam.srcObject;
            
            // Check if MediaRecorder is supported
            if (!MediaRecorder.isTypeSupported('video/webm')) {
                throw new Error('Video recording not supported in this browser');
            }

            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'video/webm'
            });
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
                this.loadVideoFromBlob(blob);
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.showError('Recording failed. Please try again.');
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.startRecording.style.display = 'none';
            this.stopRecording.style.display = 'inline-block';
        } catch (error) {
            console.error('Error starting recording:', error);
            this.showError('Failed to start recording. Please ensure your browser supports video recording.');
        }
    }

    stopVideoRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.startRecording.style.display = 'inline-block';
            this.stopRecording.style.display = 'none';
        }
    }

    handleVideoUpload(event) {
        const file = event.target.files[0];
        if (file) {
            console.log('File selected:', {
                name: file.name,
                type: file.type,
                size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
            });
            
            // Validate file size
            const maxSize = window.DEMO_CONFIG?.MAX_VIDEO_SIZE || 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                this.showError(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`);
                return;
            }

            // More permissive file type validation
            const supportedFormats = window.DEMO_CONFIG?.SUPPORTED_FORMATS || ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
            const isVideoFile = file.type.startsWith('video/') || 
                               file.name.toLowerCase().match(/\.(mp4|webm|mov|avi|mkv|m4v|3gp)$/);
            
            if (!isVideoFile && !supportedFormats.includes(file.type)) {
                console.warn('Unsupported file type detected:', file.type);
                this.showError('Unsupported file format. Please use MP4, WebM, MOV, or AVI files.');
                return;
            }
            
            if (!supportedFormats.includes(file.type) && isVideoFile) {
                console.warn('File type not in supported list but appears to be video, attempting to load:', file.type);
            }

            this.loadVideoFromBlob(file);
        }
    }

    loadVideoFromBlob(blob) {
        const url = URL.createObjectURL(blob);
        this.inputVideo.src = url;
        this.inputVideo.style.display = 'block';
        this.currentVideo = this.inputVideo;
        
        // Store URL for later cleanup
        this.currentVideoURL = url;
        
        // Reset analyze button state
        this.analyzeBtn.disabled = true;
        
        // Clear any existing event listeners to prevent duplicates
        this.inputVideo.removeEventListener('loadstart', this.videoLoadStartHandler);
        this.inputVideo.removeEventListener('loadedmetadata', this.videoMetadataHandler);
        this.inputVideo.removeEventListener('loadeddata', this.videoDataHandler);
        this.inputVideo.removeEventListener('error', this.videoErrorHandler);
        this.inputVideo.removeEventListener('canplay', this.videoCanPlayHandler);
        
        // Create bound event handlers for proper cleanup
        this.videoLoadStartHandler = () => {
            console.log('Video loading started');
        };
        
        this.videoMetadataHandler = () => {
            console.log(`Video metadata loaded: ${this.inputVideo.videoWidth}x${this.inputVideo.videoHeight}, duration: ${this.inputVideo.duration}s`);
            
            // Validate video dimensions and duration
            if (!this.inputVideo.videoWidth || !this.inputVideo.videoHeight) {
                console.error('Invalid video dimensions');
                this.showError('Invalid video file. Please try a different video.');
                return;
            }
            
            if (!this.inputVideo.duration || this.inputVideo.duration < 1) {
                console.error('Invalid video duration');
                this.showError('Video too short or invalid. Please use a video at least 1 second long.');
                return;
            }
        };
        
        this.videoDataHandler = () => {
            console.log('Video data loaded, checking readiness...');
            
            // Additional readiness checks
            if (this.inputVideo.readyState >= 2) { // HAVE_CURRENT_DATA
                console.log('Video ready for analysis');
                this.analyzeBtn.disabled = false;
                
                // Don't revoke URL immediately - keep it for analysis
                // URL will be cleaned up in reset() or when new video is loaded
            } else {
                console.warn('Video data loaded but not ready for playback');
                // Try again after a short delay
                setTimeout(() => {
                    if (this.inputVideo.readyState >= 2) {
                        console.log('Video ready for analysis (delayed check)');
                        this.analyzeBtn.disabled = false;
                    }
                }, 500);
            }
        };
        
        this.videoCanPlayHandler = () => {
            console.log('Video can play - additional readiness confirmation');
            if (this.analyzeBtn.disabled) {
                this.analyzeBtn.disabled = false;
                console.log('Analyze button enabled via canplay event');
            }
        };
        
        this.videoErrorHandler = (e) => {
            console.error('Video loading error:', e);
            console.error('Video error details:', {
                error: this.inputVideo.error,
                networkState: this.inputVideo.networkState,
                readyState: this.inputVideo.readyState
            });
            
            // Clean up URL on error
            if (this.currentVideoURL) {
                URL.revokeObjectURL(this.currentVideoURL);
                this.currentVideoURL = null;
            }
            
            // Provide more specific error messages
            let errorMessage = 'Failed to load video. ';
            if (this.inputVideo.error) {
                switch (this.inputVideo.error.code) {
                    case 1: // MEDIA_ERR_ABORTED
                        errorMessage += 'Video loading was aborted.';
                        break;
                    case 2: // MEDIA_ERR_NETWORK
                        errorMessage += 'Network error occurred.';
                        break;
                    case 3: // MEDIA_ERR_DECODE
                        errorMessage += 'Video format not supported or corrupted.';
                        break;
                    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                        errorMessage += 'Video format not supported by your browser.';
                        break;
                    default:
                        errorMessage += 'Unknown error occurred.';
                }
            } else {
                errorMessage += 'Please try a different file format (MP4 recommended).';
            }
            
            this.showError(errorMessage);
        };
        
        // Add event listeners
        this.inputVideo.addEventListener('loadstart', this.videoLoadStartHandler);
        this.inputVideo.addEventListener('loadedmetadata', this.videoMetadataHandler);
        this.inputVideo.addEventListener('loadeddata', this.videoDataHandler);
        this.inputVideo.addEventListener('canplay', this.videoCanPlayHandler);
        this.inputVideo.addEventListener('error', this.videoErrorHandler);
        
        // Force load if video is already ready (cached)
        if (this.inputVideo.readyState >= 2) {
            console.log('Video already ready, enabling analyze button');
            this.analyzeBtn.disabled = false;
        }
        
        // Hide camera section
        this.cameraSection.style.display = 'none';
        if (this.camera) {
            this.camera.stop();
        }
    }

    async analyzeVideo() {
        if (!this.currentVideo) return;

        this.showLoading(true);
        this.showProgress(true);
        this.updateAnalysisStatus('processing', 'Starting analysis...');
        this.analysisResults = [];
        this.frameCount = 0;

        try {
            await this.processVideoFrames();
            
            // Check if we have enough data for analysis
            if (this.analysisResults.length === 0) {
                console.error('No analysis results generated');
                this.updateAnalysisStatus('error', 'No pose data detected');
                this.showFeedback([{
                    type: 'error',
                    title: '❌ No Analysis Data',
                    message: 'Unable to detect any pose data in the video. This could be due to several factors:',
                    suggestion: `
                        <strong>Common issues:</strong><br>
                        • <strong>Camera angle:</strong> Record from the side view (90° angle) for best results<br>
                        • <strong>Distance:</strong> Stand 6-10 feet away from camera to show full body<br>
                        • <strong>Lighting:</strong> Ensure good lighting so the person is clearly visible<br>
                        • <strong>Movement:</strong> Make sure there's clear leg movement (walking/jogging/running)<br>
                        • <strong>Full body:</strong> Keep head, torso, and legs in frame throughout the video<br><br>
                        <strong>Try:</strong> Record a side-view video showing your full body while jogging in place or walking.
                    `
                }]);
            } else if (this.analysisResults.length < 5) {
                this.updateAnalysisStatus('complete', `Limited data: ${this.analysisResults.length} frames`);
                this.showFeedback([{
                    type: 'warning',
                    title: '⚠️ Limited Analysis Data',
                    message: `Only ${this.analysisResults.length} frames were analyzed. Results may not be accurate.`,
                    suggestion: 'For better results, try a longer video (10-15 seconds) with clearer view of the runner.'
                }]);
            } else {
                this.updateAnalysisStatus('complete', `Analysis complete: ${this.analysisResults.length} frames`);
                this.generateFeedback();
            }
            
            // Show video controls after analysis
            if (this.videoControls && this.analysisResults.length > 0) {
                this.videoControls.style.display = 'flex';
            }
            
            this.showLoading(false);
            this.showProgress(false);
        } catch (error) {
            console.error('Error during analysis:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Analysis failed. ';
            if (error.message.includes('timeout')) {
                errorMessage += 'The video took too long to process. Try a shorter video or use a faster device.';
            } else if (error.message.includes('MediaPipe') || error.message.includes('pose')) {
                errorMessage += 'Pose detection failed. Please check your internet connection and try again.';
            } else if (error.message.includes('video')) {
                errorMessage += 'Video processing failed. Please try a different video format or re-record.';
            } else {
                errorMessage += 'Please try again with a clearer video or check your internet connection.';
            }
            
            this.updateAnalysisStatus('error', 'Analysis failed');
            this.showError(errorMessage);
            this.showLoading(false);
            this.showProgress(false);
        }
    }

    async processVideoFrames() {
        return new Promise((resolve, reject) => {
            const video = this.currentVideo;
            
            // Validate video element
            if (!video || !video.videoWidth || !video.videoHeight) {
                reject(new Error('Invalid video element or video not loaded'));
                return;
            }

            // Wait for video to be ready
            const waitForVideoReady = () => {
                return new Promise((resolveReady) => {
                    if (video.readyState >= 2) { // HAVE_CURRENT_DATA
                        resolveReady();
                    } else {
                        video.addEventListener('loadeddata', resolveReady, { once: true });
                        // Fallback timeout
                        setTimeout(resolveReady, 2000);
                    }
                });
            };

            waitForVideoReady().then(() => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Failed to create canvas context'));
                    return;
                }
                
                // Desktop optimization - use full resolution for best accuracy
                canvas.width = video.videoWidth || 1280;
                canvas.height = video.videoHeight || 720;
                
                // Set output canvas size
                this.outputCanvas.width = canvas.width;
                this.outputCanvas.height = canvas.height;

                video.currentTime = 0;
                
                // Desktop-optimized frame processing for maximum accuracy
                const frameInterval = window.DEMO_CONFIG?.FRAME_INTERVAL || 0.05; // Higher frequency for better analysis
                const maxProcessingTime = window.DEMO_CONFIG?.PERFORMANCE?.MAX_PROCESSING_TIME || 120000; // 2 minutes max
                const maxFrames = 300; // More frames for comprehensive analysis
                
                let processInterval;
                let timeoutId;
                let frameCount = 0;
                let consecutiveErrors = 0;
                const maxConsecutiveErrors = 10; // Higher tolerance for desktop

                // Set timeout for maximum processing time
                timeoutId = setTimeout(() => {
                    clearInterval(processInterval);
                    if (frameCount > 0) {
                        console.log(`Processing stopped due to timeout. Analyzed ${frameCount} frames.`);
                        resolve(); // Resolve with partial results instead of rejecting
                    } else {
                        reject(new Error('Processing timeout - video analysis took too long. Try a shorter video.'));
                    }
                }, maxProcessingTime);

                const processFrame = async () => {
                    try {
                        if (video.currentTime >= video.duration || frameCount >= maxFrames) {
                            clearInterval(processInterval);
                            clearTimeout(timeoutId);
                            console.log(`Processing completed. Analyzed ${frameCount} frames.`);
                            resolve();
                            return;
                        }

                        // Update progress
                        const progress = Math.min((video.currentTime / video.duration) * 100, (frameCount / maxFrames) * 100);
                        this.updateProgress(progress);

                        // Ensure video is at the correct time
                        if (Math.abs(video.currentTime - (frameCount * frameInterval)) > 0.1) {
                            video.currentTime = frameCount * frameInterval;
                            // Wait for video to seek
                            await new Promise(resolve => setTimeout(resolve, 50));
                        }

                        // Draw with full resolution
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        if (this.pose) {
                            await this.pose.send({ image: canvas });
                        }

                        video.currentTime += frameInterval;
                        frameCount++;
                        consecutiveErrors = 0; // Reset error counter on success
                        
                    } catch (error) {
                        console.error('Error processing frame:', error);
                        consecutiveErrors++;
                        
                        // If too many consecutive errors, stop processing
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            clearInterval(processInterval);
                            clearTimeout(timeoutId);
                            if (frameCount > 10) {
                                console.log(`Stopping due to errors. Analyzed ${frameCount} frames.`);
                                resolve(); // Resolve with partial results
                            } else {
                                reject(new Error('Too many processing errors. Please try a different video or check your internet connection.'));
                            }
                            return;
                        }
                        
                        // Continue with next frame
                        video.currentTime += frameInterval;
                        frameCount++;
                    }
                };

                // Desktop processing interval for smooth performance
                processInterval = setInterval(processFrame, 100);
            }).catch((error) => {
                reject(new Error('Failed to prepare video for analysis: ' + error.message));
            });
        });
    }

    onPoseResults(results) {
        try {
            this.frameCount++;
            
            // Validate canvas context
            if (!this.canvasCtx || !this.outputCanvas) {
                console.warn('Canvas context not available, skipping frame rendering');
                return;
            }
            
            // Draw the current frame
            this.canvasCtx.save();
            this.canvasCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
            
            // Draw the video frame
            if (this.currentVideo) {
                try {
                    this.canvasCtx.drawImage(this.currentVideo, 0, 0, this.outputCanvas.width, this.outputCanvas.height);
                } catch (error) {
                    console.warn('Failed to draw video frame:', error);
                }
            }

            // Process pose landmarks if available
            if (results && results.poseLandmarks && results.poseLandmarks.length > 0) {
                try {
                    // Validate landmarks data
                    const validLandmarks = results.poseLandmarks.filter(landmark => 
                        landmark && 
                        typeof landmark.x === 'number' && 
                        typeof landmark.y === 'number' && 
                        !isNaN(landmark.x) && 
                        !isNaN(landmark.y)
                    );

                    console.log(`Frame ${this.frameCount}: ${validLandmarks.length}/${results.poseLandmarks.length} valid landmarks`);

                    if (validLandmarks.length >= 10) { // Reduced from 20 for very lenient detection
                        // Analyze pose for running form issues
                        const analysis = this.analyzePose(validLandmarks);
                        if (analysis) {
                            console.log(`Frame ${this.frameCount} analysis:`, {
                                isRunning: analysis.isRunning,
                                kneeAngle: analysis.kneeAngle.toFixed(1),
                                torsoAngle: analysis.torsoAngle.toFixed(1),
                                debug: analysis.debug
                            });
                            this.analysisResults.push(analysis);
                            // Draw pose landmarks and connections
                            this.drawPose(validLandmarks, analysis);
                        }
                    } else {
                        console.warn(`Frame ${this.frameCount}: Insufficient valid landmarks (${validLandmarks.length}/10 required)`);
                    }
                } catch (error) {
                    console.warn('Failed to analyze or draw pose:', error);
                }
            } else {
                console.warn(`Frame ${this.frameCount}: No pose landmarks detected`);
            }

            this.canvasCtx.restore();
        } catch (error) {
            console.error('Error in onPoseResults:', error);
            // Don't throw error to prevent breaking the processing loop
        }
    }

    analyzePose(landmarks) {
        const config = window.DEMO_CONFIG || {};
        const analysis = {
            frame: this.frameCount,
            timestamp: this.frameCount * (config.FRAME_INTERVAL || 0.05),
            lowKneeDrive: false,
            excessiveForwardLean: false,
            kneeAngle: 0,
            torsoAngle: 0,
            isRunning: false,
            // Advanced metrics
            leftFootHeight: 0,
            rightFootHeight: 0,
            stridePhase: 'unknown',
            footStrike: 'unknown',
            verticalOscillation: 0,
            debug: {
                landmarkCount: landmarks.length,
                visibleLandmarks: landmarks.filter(l => l && l.visibility > 0.3).length
            }
        };

        try {
            // Check if person is in running/moving position
            analysis.isRunning = this.detectRunningMotion(landmarks);
            
            // Even if not "running", still analyze if we have good pose data
            const hasGoodPoseData = landmarks.length >= 15 && // Reduced from 25
                                   landmarks.filter(l => l && l.visibility > 0.2).length >= 8; // Reduced threshold
            
            if (analysis.isRunning || hasGoodPoseData) {
                // Basic analysis
                analysis.kneeAngle = this.calculateKneeAngle(landmarks);
                if (!isNaN(analysis.kneeAngle) && analysis.kneeAngle > 0) {
                    analysis.lowKneeDrive = analysis.kneeAngle < (config.KNEE_DRIVE_THRESHOLD || 45);
                }

                analysis.torsoAngle = this.calculateTorsoAngle(landmarks);
                if (!isNaN(analysis.torsoAngle) && analysis.torsoAngle > 0) {
                    analysis.excessiveForwardLean = analysis.torsoAngle < (config.FORWARD_LEAN_THRESHOLD || 160);
                }

                // Advanced biomechanical analysis
                this.calculateAdvancedMetrics(landmarks, analysis);
                
                // If we have good pose data but not detected as "running", still mark as valid
                if (!analysis.isRunning && hasGoodPoseData) {
                    analysis.isRunning = true; // Override for analysis purposes
                    console.log('Overriding running detection due to good pose data');
                }
            }
            
            analysis.debug.kneeAngle = analysis.kneeAngle;
            analysis.debug.torsoAngle = analysis.torsoAngle;
            analysis.debug.stridePhase = analysis.stridePhase;
            
        } catch (error) {
            console.error('Error analyzing pose:', error);
            analysis.debug.error = error.message;
        }

        return analysis;
    }

    calculateAdvancedMetrics(landmarks, analysis) {
        // Calculate foot heights for stride analysis
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        if (leftAnkle && leftHip && leftAnkle.visibility > 0.3 && leftHip.visibility > 0.3) {
            analysis.leftFootHeight = Math.abs(leftHip.y - leftAnkle.y);
        }

        if (rightAnkle && rightHip && rightAnkle.visibility > 0.3 && rightHip.visibility > 0.3) {
            analysis.rightFootHeight = Math.abs(rightHip.y - rightAnkle.y);
        }

        // Determine stride phase
        if (analysis.leftFootHeight > 0 && analysis.rightFootHeight > 0) {
            const heightDiff = Math.abs(analysis.leftFootHeight - analysis.rightFootHeight);
            
            if (heightDiff < 0.05) {
                analysis.stridePhase = 'double_support';
            } else if (analysis.leftFootHeight > analysis.rightFootHeight) {
                analysis.stridePhase = 'left_swing';
            } else {
                analysis.stridePhase = 'right_swing';
            }
        }

        // Foot strike pattern analysis
        this.analyzeFootStrike(landmarks, analysis);

        // Vertical oscillation (center of mass movement)
        this.calculateVerticalOscillation(landmarks, analysis);
    }

    analyzeFootStrike(landmarks, analysis) {
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
        const leftToe = landmarks[31];
        const rightToe = landmarks[32];

        // Analyze foot angle at contact
        if (leftAnkle && leftToe && leftAnkle.visibility > 0.3 && leftToe.visibility > 0.3) {
            const footAngle = Math.atan2(leftToe.y - leftAnkle.y, leftToe.x - leftAnkle.x) * (180 / Math.PI);
            
            if (Math.abs(footAngle) < 10) {
                analysis.footStrike = 'midfoot';
            } else if (footAngle > 10) {
                analysis.footStrike = 'heel';
            } else {
                analysis.footStrike = 'forefoot';
            }
        }
    }

    calculateVerticalOscillation(landmarks, analysis) {
        // Calculate center of mass approximation
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];

        if (leftHip && rightHip && leftShoulder && rightShoulder) {
            const centerY = (leftHip.y + rightHip.y + leftShoulder.y + rightShoulder.y) / 4;
            
            // Store for comparison with previous frames
            if (!this.previousCenterY) {
                this.previousCenterY = centerY;
            }
            
            analysis.verticalOscillation = Math.abs(centerY - this.previousCenterY);
            this.previousCenterY = centerY;
        }
    }

    detectRunningMotion(landmarks) {
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
        
        // More lenient - check if we have at least some key points
        const hasHips = (leftHip && leftHip.visibility > 0.2) || (rightHip && rightHip.visibility > 0.2);
        const hasKnees = (leftKnee && leftKnee.visibility > 0.2) || (rightKnee && rightKnee.visibility > 0.2);
        const hasAnkles = (leftAnkle && leftAnkle.visibility > 0.2) || (rightAnkle && rightAnkle.visibility > 0.2);
        
        // Very lenient detection - accept if we have any leg parts
        const hasLegMovement = hasKnees || hasAnkles;
        
        if (!hasLegMovement) {
            console.warn('No leg movement detected:', {
                hasHips,
                hasKnees, 
                hasAnkles,
                leftKneeVis: leftKnee?.visibility,
                rightKneeVis: rightKnee?.visibility
            });
            return false;
        }
        
        // If we have hips and knees, check upright position
        if (hasHips && hasKnees) {
            const avgHipY = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : 
                           leftHip ? leftHip.y : rightHip.y;
            const avgKneeY = leftKnee && rightKnee ? (leftKnee.y + rightKnee.y) / 2 :
                            leftKnee ? leftKnee.y : rightKnee.y;
            
            const isUpright = avgHipY < avgKneeY;
            
            if (!isUpright) {
                console.warn('Not upright position:', { avgHipY, avgKneeY });
                // Still return true for leg movement even if not perfectly upright
            }
        }
        
        console.log('Motion detected with leg movement');
        return true; // Accept any leg movement
    }

    calculateKneeAngle(landmarks) {
        const leftHip = landmarks[23];
        const leftKnee = landmarks[25];
        const leftAnkle = landmarks[27];
        const rightHip = landmarks[24];
        const rightKnee = landmarks[26];
        const rightAnkle = landmarks[28];

        // Use the leg with better visibility
        let hip, knee, ankle;
        if (leftKnee.visibility > rightKnee.visibility) {
            hip = leftHip;
            knee = leftKnee;
            ankle = leftAnkle;
        } else {
            hip = rightHip;
            knee = rightKnee;
            ankle = rightAnkle;
        }

        return this.calculateAngle(hip, knee, ankle);
    }

    calculateTorsoAngle(landmarks) {
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        const shoulderMidpoint = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
        };

        const hipMidpoint = {
            x: (leftHip.x + rightHip.x) / 2,
            y: (leftHip.y + rightHip.y) / 2
        };

        const deltaX = shoulderMidpoint.x - hipMidpoint.x;
        const deltaY = shoulderMidpoint.y - hipMidpoint.y;
        const angle = Math.atan2(Math.abs(deltaX), Math.abs(deltaY)) * (180 / Math.PI);
        
        return 180 - angle;
    }

    calculateAngle(point1, point2, point3) {
        const vector1 = {
            x: point1.x - point2.x,
            y: point1.y - point2.y
        };
        
        const vector2 = {
            x: point3.x - point2.x,
            y: point3.y - point2.y
        };

        const dot = vector1.x * vector2.x + vector1.y * vector2.y;
        const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
        const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
        
        const cos = dot / (mag1 * mag2);
        const angle = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
        
        return angle;
    }

    drawPose(landmarks, analysis) {
        const width = this.outputCanvas.width;
        const height = this.outputCanvas.height;

        // Define pose connections with enhanced styling
        const connections = [
            // Arms
            { start: 11, end: 12, type: 'torso' }, // Shoulders
            { start: 11, end: 13, type: 'arm' }, { start: 13, end: 15, type: 'arm' }, // Left arm
            { start: 12, end: 14, type: 'arm' }, { start: 14, end: 16, type: 'arm' }, // Right arm
            // Torso
            { start: 11, end: 23, type: 'torso' }, { start: 12, end: 24, type: 'torso' }, 
            { start: 23, end: 24, type: 'torso' }, // Hip line
            // Legs - color-coded based on analysis
            { start: 23, end: 25, type: 'leg', side: 'left' }, { start: 25, end: 27, type: 'leg', side: 'left' }, // Left leg
            { start: 24, end: 26, type: 'leg', side: 'right' }, { start: 26, end: 28, type: 'leg', side: 'right' }, // Right leg
            // Feet
            { start: 27, end: 29, type: 'foot' }, { start: 29, end: 31, type: 'foot' }, // Left foot
            { start: 28, end: 30, type: 'foot' }, { start: 30, end: 32, type: 'foot' } // Right foot
        ];

        // Enhanced color scheme based on analysis
        const getConnectionColor = (connection) => {
            if (connection.type === 'leg' && analysis.lowKneeDrive) {
                return '#ff4757'; // Red for low knee drive
            }
            if (connection.type === 'torso' && analysis.excessiveForwardLean) {
                return '#ff6b35'; // Orange for forward lean
            }
            if (connection.type === 'leg') {
                return '#2ed573'; // Green for good legs
            }
            if (connection.type === 'torso') {
                return '#1e90ff'; // Blue for good torso
            }
            return '#4ecdc4'; // Default cyan
        };

        // Draw connections with enhanced styling
        connections.forEach(connection => {
            const startPoint = landmarks[connection.start];
            const endPoint = landmarks[connection.end];
            
            if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
                const color = getConnectionColor(connection);
                
                this.canvasCtx.strokeStyle = color;
                this.canvasCtx.lineWidth = connection.type === 'leg' ? 4 : 3;
                this.canvasCtx.lineCap = 'round';
                this.canvasCtx.shadowColor = color;
                this.canvasCtx.shadowBlur = 2;
                
                this.canvasCtx.beginPath();
                this.canvasCtx.moveTo(startPoint.x * width, startPoint.y * height);
                this.canvasCtx.lineTo(endPoint.x * width, endPoint.y * height);
                this.canvasCtx.stroke();
                
                // Reset shadow
                this.canvasCtx.shadowBlur = 0;
            }
        });

        // Draw enhanced landmarks
        landmarks.forEach((landmark, index) => {
            if (landmark.visibility > 0.5) {
                const x = landmark.x * width;
                const y = landmark.y * height;
                
                let color = '#ff6b6b';
                let radius = 4;
                let isProblematic = false;
                
                // Enhanced landmark styling based on analysis
                if (analysis.lowKneeDrive && (index === 25 || index === 26)) {
                    color = '#ff4757';
                    radius = 8;
                    isProblematic = true;
                }
                
                if (analysis.excessiveForwardLean && (index === 11 || index === 12)) {
                    color = '#ff6b35';
                    radius = 8;
                    isProblematic = true;
                }

                // Key joint highlighting
                if ([23, 24, 25, 26, 27, 28].includes(index)) { // Hips, knees, ankles
                    radius = 6;
                    if (!isProblematic) {
                        color = '#2ed573'; // Green for good joints
                    }
                }

                // Draw landmark with glow effect for problematic areas
                if (isProblematic) {
                    this.canvasCtx.shadowColor = color;
                    this.canvasCtx.shadowBlur = 10;
                }

                this.canvasCtx.fillStyle = color;
                this.canvasCtx.strokeStyle = '#fff';
                this.canvasCtx.lineWidth = 2;
                this.canvasCtx.beginPath();
                this.canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
                this.canvasCtx.fill();
                this.canvasCtx.stroke();
                
                // Reset shadow
                this.canvasCtx.shadowBlur = 0;
            }
        });

        // Real-time angle display
        this.drawAngleDisplay(landmarks, analysis, width, height);
    }

    drawAngleDisplay(landmarks, analysis, width, height) {
        // Display knee angle
        if (analysis.kneeAngle > 0) {
            const leftKnee = landmarks[25];
            const rightKnee = landmarks[26];
            
            // Choose the knee with better visibility
            const knee = (leftKnee && leftKnee.visibility > 0.5) ? leftKnee : 
                        (rightKnee && rightKnee.visibility > 0.5) ? rightKnee : null;
            
            if (knee) {
                const x = knee.x * width;
                const y = knee.y * height;
                
                // Angle display background
                this.canvasCtx.fillStyle = analysis.lowKneeDrive ? 'rgba(255, 71, 87, 0.9)' : 'rgba(46, 213, 115, 0.9)';
                this.canvasCtx.fillRect(x - 30, y - 40, 60, 25);
                
                // Angle text
                this.canvasCtx.fillStyle = 'white';
                this.canvasCtx.font = 'bold 12px Arial';
                this.canvasCtx.textAlign = 'center';
                this.canvasCtx.fillText(`${analysis.kneeAngle.toFixed(0)}°`, x, y - 22);
            }
        }

        // Display torso angle
        if (analysis.torsoAngle > 0) {
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            
            if (leftShoulder && rightShoulder && leftShoulder.visibility > 0.5 && rightShoulder.visibility > 0.5) {
                const x = ((leftShoulder.x + rightShoulder.x) / 2) * width;
                const y = ((leftShoulder.y + rightShoulder.y) / 2) * height;
                
                // Torso angle display
                this.canvasCtx.fillStyle = analysis.excessiveForwardLean ? 'rgba(255, 107, 53, 0.9)' : 'rgba(30, 144, 255, 0.9)';
                this.canvasCtx.fillRect(x - 30, y - 15, 60, 25);
                
                this.canvasCtx.fillStyle = 'white';
                this.canvasCtx.font = 'bold 12px Arial';
                this.canvasCtx.textAlign = 'center';
                this.canvasCtx.fillText(`${analysis.torsoAngle.toFixed(0)}°`, x, y + 2);
            }
        }

        // Frame counter and status
        this.canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.canvasCtx.fillRect(10, 10, 200, 50);
        
        this.canvasCtx.fillStyle = 'white';
        this.canvasCtx.font = 'bold 14px Arial';
        this.canvasCtx.textAlign = 'left';
        this.canvasCtx.fillText(`Frame: ${this.frameCount}`, 20, 30);
        
        // Status indicator
        const status = analysis.lowKneeDrive || analysis.excessiveForwardLean ? 'Issues Detected' : 'Good Form';
        const statusColor = analysis.lowKneeDrive || analysis.excessiveForwardLean ? '#ff4757' : '#2ed573';
        this.canvasCtx.fillStyle = statusColor;
        this.canvasCtx.fillText(`Status: ${status}`, 20, 50);
    }

    generateFeedback() {
        const runningFrames = this.analysisResults.filter(r => r.isRunning);
        const config = window.DEMO_CONFIG || {};
        
        // Check if we have enough running frames
        if (runningFrames.length === 0) {
            this.showFeedback([{
                type: 'warning',
                title: config.MESSAGES?.NO_RUNNING?.title || '⚠️ No Running Motion Detected',
                message: config.MESSAGES?.NO_RUNNING?.message || 'Please ensure you are running in the video for accurate analysis.',
                suggestion: config.MESSAGES?.NO_RUNNING?.suggestion || 'Record a side-view video of yourself running for 10-20 seconds.'
            }]);
            return;
        }

        // Calculate advanced metrics
        const advancedMetrics = this.calculateAdvancedFeedbackMetrics(runningFrames);
        
        // Add warning for limited data
        const feedback = [];
        
        if (runningFrames.length < 20) {
            feedback.push({
                type: 'info',
                title: '📊 Limited Data Notice',
                message: `Analysis based on ${runningFrames.length} running frames. For more accurate results, try a longer video.`,
                suggestion: 'Record 15-30 seconds of continuous running for comprehensive analysis.'
            });
        }

        const warningThreshold = config.WARNING_THRESHOLD || 10;
        const errorThreshold = config.ERROR_THRESHOLD || 30;
        
        // Analyze low knee drive
        const lowKneeFrames = runningFrames.filter(r => r.lowKneeDrive);
        const lowKneePercentage = (lowKneeFrames.length / runningFrames.length) * 100;
        
        if (lowKneePercentage > errorThreshold) {
            feedback.push({
                type: 'error',
                title: '🚨 Low Knee Drive Detected',
                message: `${lowKneePercentage.toFixed(1)}% of your running shows insufficient knee lift. This reduces stride power and efficiency.`,
                suggestion: config.MESSAGES?.LOW_KNEE_DRIVE?.suggestion || 'Focus on lifting your knees to at least 45° during your stride. Practice high knees drills to improve this.'
            });
        } else if (lowKneePercentage > warningThreshold) {
            feedback.push({
                type: 'warning',
                title: '⚠️ Occasional Low Knee Drive',
                message: `${lowKneePercentage.toFixed(1)}% of your running shows low knee drive. Room for improvement.`,
                suggestion: 'Work on maintaining consistent knee lift throughout your run.'
            });
        }

        // Analyze excessive forward lean
        const forwardLeanFrames = runningFrames.filter(r => r.excessiveForwardLean);
        const forwardLeanPercentage = (forwardLeanFrames.length / runningFrames.length) * 100;
        
        if (forwardLeanPercentage > errorThreshold) {
            feedback.push({
                type: 'error',
                title: '🚨 Excessive Forward Lean',
                message: `${forwardLeanPercentage.toFixed(1)}% of your running shows excessive forward lean. This can lead to lower back pain and reduced efficiency.`,
                suggestion: config.MESSAGES?.FORWARD_LEAN?.suggestion || 'Focus on maintaining an upright posture. Imagine a string pulling you up from the top of your head.'
            });
        } else if (forwardLeanPercentage > warningThreshold) {
            feedback.push({
                type: 'warning',
                title: '⚠️ Slight Forward Lean',
                message: `${forwardLeanPercentage.toFixed(1)}% of your running shows forward lean. Monitor your posture.`,
                suggestion: 'Practice running with a slight backward lean to counteract forward lean tendency.'
            });
        }

        // Advanced biomechanical feedback
        this.addAdvancedFeedback(feedback, advancedMetrics, runningFrames);

        // Add positive feedback if form is good
        if (lowKneePercentage <= warningThreshold && forwardLeanPercentage <= warningThreshold) {
            feedback.push({
                type: 'good',
                title: config.MESSAGES?.GOOD_FORM?.title || '✅ Excellent Running Form!',
                message: config.MESSAGES?.GOOD_FORM?.message || 'Your running form shows good knee drive and posture. Keep up the excellent work!',
                suggestion: config.MESSAGES?.GOOD_FORM?.suggestion || 'Continue maintaining this form and consider working on other aspects like cadence and foot strike.'
            });
        }

        // Enhanced metrics display
        this.addEnhancedMetrics(feedback, runningFrames, advancedMetrics);

        this.showFeedback(feedback);
    }

    calculateAdvancedFeedbackMetrics(runningFrames) {
        const metrics = {
            cadence: 0,
            strideCount: 0,
            avgVerticalOscillation: 0,
            footStrikePattern: {},
            stridePhases: {}
        };

        // Calculate cadence (steps per minute)
        const strideSwitches = this.detectStrideSwitches(runningFrames);
        const totalTime = runningFrames.length * (window.DEMO_CONFIG?.FRAME_INTERVAL || 0.05);
        metrics.cadence = Math.round((strideSwitches * 60) / totalTime);
        metrics.strideCount = strideSwitches;

        // Average vertical oscillation
        const oscillations = runningFrames.filter(f => f.verticalOscillation > 0).map(f => f.verticalOscillation);
        if (oscillations.length > 0) {
            metrics.avgVerticalOscillation = oscillations.reduce((a, b) => a + b, 0) / oscillations.length;
        }

        // Foot strike pattern distribution
        runningFrames.forEach(frame => {
            if (frame.footStrike && frame.footStrike !== 'unknown') {
                metrics.footStrikePattern[frame.footStrike] = (metrics.footStrikePattern[frame.footStrike] || 0) + 1;
            }
        });

        // Stride phase distribution
        runningFrames.forEach(frame => {
            if (frame.stridePhase && frame.stridePhase !== 'unknown') {
                metrics.stridePhases[frame.stridePhase] = (metrics.stridePhases[frame.stridePhase] || 0) + 1;
            }
        });

        return metrics;
    }

    detectStrideSwitches(frames) {
        let switches = 0;
        let lastPhase = null;

        frames.forEach(frame => {
            if (frame.stridePhase && frame.stridePhase !== 'unknown' && frame.stridePhase !== 'double_support') {
                if (lastPhase && lastPhase !== frame.stridePhase) {
                    switches++;
                }
                lastPhase = frame.stridePhase;
            }
        });

        return switches;
    }

    addAdvancedFeedback(feedback, metrics, runningFrames) {
        // Cadence feedback
        if (metrics.cadence > 0) {
            if (metrics.cadence < 160) {
                feedback.push({
                    type: 'warning',
                    title: '🏃‍♂️ Low Cadence Detected',
                    message: `Your cadence is ${metrics.cadence} steps/min. Optimal range is 170-180 steps/min.`,
                    suggestion: 'Try taking shorter, quicker steps to increase your cadence and improve efficiency.'
                });
            } else if (metrics.cadence > 200) {
                feedback.push({
                    type: 'warning',
                    title: '🏃‍♂️ High Cadence Detected',
                    message: `Your cadence is ${metrics.cadence} steps/min. This might indicate overstriding.`,
                    suggestion: 'Focus on landing with your feet closer to your center of gravity.'
                });
            } else {
                feedback.push({
                    type: 'good',
                    title: '🎯 Excellent Cadence',
                    message: `Your cadence of ${metrics.cadence} steps/min is in the optimal range!`,
                    suggestion: 'Maintain this cadence for efficient running.'
                });
            }
        }

        // Foot strike feedback
        const dominantStrike = Object.keys(metrics.footStrikePattern).reduce((a, b) => 
            metrics.footStrikePattern[a] > metrics.footStrikePattern[b] ? a : b, 'unknown');
        
        if (dominantStrike !== 'unknown') {
            const strikeAdvice = {
                'heel': {
                    type: 'info',
                    title: '👟 Heel Strike Pattern',
                    message: 'You primarily land on your heels. This is common but may increase impact forces.',
                    suggestion: 'Consider transitioning to a midfoot strike for better shock absorption.'
                },
                'midfoot': {
                    type: 'good',
                    title: '👟 Optimal Midfoot Strike',
                    message: 'Excellent! You\'re landing on your midfoot, which provides good shock absorption.',
                    suggestion: 'Continue maintaining this efficient foot strike pattern.'
                },
                'forefoot': {
                    type: 'info',
                    title: '👟 Forefoot Strike Pattern',
                    message: 'You land on your forefoot. This can be efficient but may stress your calves.',
                    suggestion: 'Ensure adequate calf strength and consider heel drop in your shoes.'
                }
            };

            if (strikeAdvice[dominantStrike]) {
                feedback.push(strikeAdvice[dominantStrike]);
            }
        }
    }

    addEnhancedMetrics(feedback, runningFrames, advancedMetrics) {
        const avgKneeAngle = runningFrames.reduce((sum, r) => sum + r.kneeAngle, 0) / runningFrames.length;
        const avgTorsoAngle = runningFrames.reduce((sum, r) => sum + r.torsoAngle, 0) / runningFrames.length;
        
        // Desktop data quality thresholds
        let dataQuality, qualityColor;
        dataQuality = runningFrames.length >= 50 ? 'Excellent' : runningFrames.length >= 30 ? 'High' : runningFrames.length >= 15 ? 'Good' : 'Fair';
        qualityColor = dataQuality === 'Excellent' ? '#198754' : dataQuality === 'High' ? '#28a745' : dataQuality === 'Good' ? '#20c997' : '#ffc107';
        
        feedback.push({
            type: 'info',
            title: '📊 Comprehensive Analysis Metrics',
            message: `
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${avgKneeAngle.toFixed(1)}°</div>
                        <div class="metric-label">Average Knee Angle</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${avgTorsoAngle.toFixed(1)}°</div>
                        <div class="metric-label">Average Torso Angle</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${advancedMetrics.cadence || 'N/A'}</div>
                        <div class="metric-label">Cadence (steps/min)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${advancedMetrics.strideCount}</div>
                        <div class="metric-label">Stride Switches</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${runningFrames.length}</div>
                        <div class="metric-label">Frames Analyzed</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value" style="color: ${qualityColor}">${dataQuality}</div>
                        <div class="metric-label">Data Quality</div>
                    </div>
                </div>
            `
        });
    }

    showFeedback(feedback) {
        this.feedbackContent.innerHTML = '';
        
        feedback.forEach((item, index) => {
            const feedbackItem = document.createElement('div');
            feedbackItem.className = `feedback-item ${item.type}`;
            feedbackItem.style.animationDelay = `${index * 0.1}s`;
            
            feedbackItem.innerHTML = `
                <h4>${item.title}</h4>
                <p>${item.message}</p>
                ${item.suggestion ? `<p><strong>Suggestion:</strong> ${item.suggestion}</p>` : ''}
            `;
            
            this.feedbackContent.appendChild(feedbackItem);
        });
        
        this.feedbackSection.style.display = 'block';
    }

    exportResults() {
        const exportCanvas = document.createElement('canvas');
        const exportCtx = exportCanvas.getContext('2d');
        
        exportCanvas.width = this.outputCanvas.width;
        exportCanvas.height = this.outputCanvas.height;
        
        // Draw the current analysis frame
        exportCtx.drawImage(this.outputCanvas, 0, 0);
        
        // Add timestamp and branding
        exportCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        exportCtx.fillRect(10, 10, 350, 60);
        exportCtx.fillStyle = 'white';
        exportCtx.font = 'bold 16px Arial';
        exportCtx.fillText('🏃‍♂️ RunForm.AI Analysis', 20, 35);
        exportCtx.font = '12px Arial';
        exportCtx.fillText(new Date().toLocaleString(), 20, 55);
        
        // Download the image
        exportCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `runform-analysis-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    showProgress(show) {
        if (this.progressSection) {
            this.progressSection.style.display = show ? 'block' : 'none';
        }
    }

    updateProgress(percentage) {
        if (this.progressBar) {
            this.progressBar.style.width = `${percentage}%`;
        }
        
        // Enhanced progress updates
        if (this.progressText) {
            if (percentage < 25) {
                this.progressText.textContent = 'Initializing pose detection...';
            } else if (percentage < 50) {
                this.progressText.textContent = 'Analyzing movement patterns...';
            } else if (percentage < 75) {
                this.progressText.textContent = 'Calculating biomechanics...';
            } else if (percentage < 95) {
                this.progressText.textContent = 'Generating insights...';
            } else {
                this.progressText.textContent = 'Finalizing analysis...';
            }
        }

        // Update real-time metrics
        if (this.framesProcessed) {
            this.framesProcessed.textContent = this.analysisResults.length;
        }

        if (this.issuesDetected) {
            const issues = this.analysisResults.filter(r => r.lowKneeDrive || r.excessiveForwardLean).length;
            this.issuesDetected.textContent = issues;
        }

        if (this.currentQuality) {
            const frames = this.analysisResults.length;
            const quality = frames >= 50 ? 'Excellent' : frames >= 30 ? 'High' : frames >= 15 ? 'Good' : 'Building...';
            this.currentQuality.textContent = quality;
        }

        // Update frame info
        if (this.frameInfo) {
            this.frameInfo.textContent = `Frame: ${this.frameCount}`;
        }
    }

    updateAnalysisStatus(status, message = '') {
        if (!this.analysisStatus) return;

        this.analysisStatus.style.display = 'block';
        const statusText = this.analysisStatus.querySelector('.status-text');
        
        // Remove existing status classes
        this.analysisStatus.classList.remove('processing', 'complete', 'error');
        
        switch (status) {
            case 'processing':
                this.analysisStatus.classList.add('processing');
                statusText.textContent = message || 'Analyzing...';
                break;
            case 'complete':
                this.analysisStatus.classList.add('complete');
                statusText.textContent = message || 'Analysis Complete!';
                setTimeout(() => {
                    this.analysisStatus.style.display = 'none';
                }, 3000);
                break;
            case 'error':
                this.analysisStatus.classList.add('error');
                statusText.textContent = message || 'Analysis Failed';
                setTimeout(() => {
                    this.analysisStatus.style.display = 'none';
                }, 5000);
                break;
            default:
                this.analysisStatus.style.display = 'none';
        }
    }

    reset() {
        // Stop camera and recording
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.isRecording) {
            this.stopVideoRecording();
        }
        
        // Clean up video URL
        if (this.currentVideoURL) {
            URL.revokeObjectURL(this.currentVideoURL);
            this.currentVideoURL = null;
        }
        
        // Clean up video event listeners
        if (this.inputVideo) {
            this.inputVideo.removeEventListener('loadstart', this.videoLoadStartHandler);
            this.inputVideo.removeEventListener('loadedmetadata', this.videoMetadataHandler);
            this.inputVideo.removeEventListener('loadeddata', this.videoDataHandler);
            this.inputVideo.removeEventListener('error', this.videoErrorHandler);
            this.inputVideo.removeEventListener('canplay', this.videoCanPlayHandler);
        }
        
        // Reset UI
        this.cameraSection.style.display = 'none';
        this.inputVideo.style.display = 'none';
        this.feedbackSection.style.display = 'none';
        this.showProgress(false);
        this.analyzeBtn.disabled = true;
        
        // Clear canvas
        if (this.canvasCtx && this.outputCanvas) {
            this.canvasCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
        }
        
        // Reset data
        this.currentVideo = null;
        this.analysisResults = [];
        this.frameCount = 0;
        this.recordedChunks = [];
        
        // Reset file input
        this.videoUpload.value = '';
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        // Enhanced error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        errorDiv.innerHTML = `
            <strong>⚠️ Error</strong><br>
            ${message}
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                float: right;
                cursor: pointer;
                font-size: 18px;
                margin-top: -5px;
            ">×</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Enhanced browser compatibility check
    const checkBrowserSupport = () => {
        const features = {
            mediaDevices: !!navigator.mediaDevices?.getUserMedia,
            mediaRecorder: !!window.MediaRecorder,
            canvas: !!HTMLCanvasElement.prototype.getContext,
            webAssembly: !!window.WebAssembly,
            es6Classes: (() => {
                try {
                    eval('class Test {}');
                    return true;
                } catch (e) {
                    return false;
                }
            })()
        };

        const unsupported = Object.entries(features)
            .filter(([key, supported]) => !supported)
            .map(([key]) => key);

        if (unsupported.length > 0) {
            console.warn('Some browser features not supported:', unsupported);
            
            // Only show warning for critical features
            const critical = ['mediaDevices', 'canvas'];
            const criticalMissing = unsupported.filter(feature => critical.includes(feature));
            
            if (criticalMissing.length > 0) {
                // Show a less intrusive warning
                setTimeout(() => {
                    const warningDiv = document.createElement('div');
                    warningDiv.style.cssText = `
                        position: fixed;
                        top: 10px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #fff3cd;
                        color: #856404;
                        padding: 10px 20px;
                        border-radius: 5px;
                        border: 1px solid #ffeaa7;
                        z-index: 1000;
                        font-size: 14px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    `;
                    warningDiv.innerHTML = `
                        ⚠️ Some features may not work optimally. For best experience, use Chrome 88+ or Firefox 85+
                        <button onclick="this.parentElement.remove()" style="
                            background: none;
                            border: none;
                            color: #856404;
                            float: right;
                            cursor: pointer;
                            margin-left: 10px;
                        ">×</button>
                    `;
                    document.body.appendChild(warningDiv);
                    
                    // Auto-remove after 5 seconds
                    setTimeout(() => {
                        if (warningDiv.parentElement) {
                            warningDiv.remove();
                        }
                    }, 5000);
                }, 1000);
            }
        } else {
            console.log('✅ All browser features supported');
        }

        return features;
    };

    // Check browser support
    const browserSupport = checkBrowserSupport();
    
    // Initialize the application
    try {
        new RunFormAnalyzer();
        console.log('🏃‍♂️ RunForm.AI initialized successfully');
    } catch (error) {
        console.error('Failed to initialize RunForm.AI:', error);
        
        // Show initialization error
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f8d7da;
            color: #721c24;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #f5c6cb;
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3>🚫 Initialization Failed</h3>
            <p>RunForm.AI failed to start. Please refresh the page or try a different browser.</p>
            <button onclick="location.reload()" style="
                background: #dc3545;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">Refresh Page</button>
        `;
        document.body.appendChild(errorDiv);
    }
}); 