class RunFormAnalyzer {
    constructor() {
        this.pose = null;
        this.camera = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.currentVideo = null;
        this.analysisResults = [];
        this.frameCount = 0;
        this.tipIndex = 0;
        
        // Detect iOS and show warning
        this.detectiOS();
        
        this.initializeElements();
        this.initializeMediaPipe();
        this.setupEventListeners();
        this.startTipRotation();
    }

    detectiOS() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
        const isLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
        
        if (isIOS) {
            // Show iOS warning after a short delay
            setTimeout(() => {
                const iosWarning = document.getElementById('iosWarning');
                if (iosWarning) {
                    let warningMessage = '📱 <strong>iOS Notice:</strong> ';
                    
                    if (isLowEndDevice || isLowMemory) {
                        warningMessage += 'Older iOS device detected. Performance may be limited. Consider using a desktop browser or newer device for best results.';
                    } else {
                        warningMessage += 'iOS optimization enabled. For best performance, close other apps and use shorter videos (5-10 seconds).';
                    }
                    
                    iosWarning.innerHTML = `<p>${warningMessage}</p>`;
                    iosWarning.style.display = 'block';
                }
            }, 2000);
            
            const deviceInfo = {
                cores: navigator.hardwareConcurrency || 'unknown',
                memory: navigator.deviceMemory || 'unknown',
                isLowEnd: isLowEndDevice || isLowMemory
            };
            
            console.log('iOS device detected - aggressive performance optimizations applied', deviceInfo);
        }
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

            // Enhanced iOS detection and optimization
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
            const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
            const isLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
            
            if (isIOS) {
                console.log('iOS device detected, applying aggressive optimization settings');
                
                // Check WebAssembly support
                if (!window.WebAssembly) {
                    throw new Error('WebAssembly not supported on this iOS version. Please update your iOS or use a different device.');
                }
                
                // Force garbage collection if available
                if (window.gc) {
                    window.gc();
                }
                
                // Reduce memory pressure
                if (isLowMemory || isLowEndDevice) {
                    console.warn('Low-end iOS device detected, applying maximum optimization');
                }
            }

            this.pose = new Pose({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
                }
            });

            // Aggressive iOS optimization
            const config = isIOS ? {
                modelComplexity: 0, // Minimum complexity for iOS
                smoothLandmarks: false, // Disabled for performance
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.8, // Higher threshold to reduce false positives
                minTrackingConfidence: 0.8,
                // Additional iOS optimizations
                staticImageMode: false,
                upperBodyOnly: false,
                smoothSegmentation: false,
                minDetectionConfidence: isLowEndDevice ? 0.9 : 0.8,
                minTrackingConfidence: isLowEndDevice ? 0.9 : 0.8
            } : (window.DEMO_CONFIG?.MEDIAPIPE_CONFIG || {
                modelComplexity: 1,
                smoothLandmarks: true,
                enableSegmentation: false,
                smoothSegmentation: false,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            this.pose.setOptions(config);
            this.pose.onResults(this.onPoseResults.bind(this));
            
            // Hide MediaPipe loading overlay
            const mediapipeLoading = document.getElementById('mediapipeLoading');
            if (mediapipeLoading) {
                mediapipeLoading.style.display = 'none';
            }
            
            console.log('MediaPipe Pose initialized successfully', isIOS ? '(iOS aggressively optimized)' : '');
        } catch (error) {
            console.error('Error initializing MediaPipe:', error);
            
            // Update loading overlay to show error
            const mediapipeLoading = document.getElementById('mediapipeLoading');
            if (mediapipeLoading) {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const errorMessage = isIOS ? 
                    'MediaPipe performance may be limited on iOS. For best results, use a desktop browser or newer iPhone/iPad.' :
                    'Please check your internet connection and refresh the page';
                    
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
            
            this.showError('Failed to initialize pose detection. ' + (error.message || 'Please try using a desktop browser for best results.'));
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
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
        
        let tips;
        if (isIOS) {
            tips = [
                "📱 iOS Tip: Use shorter videos (5-10 seconds) for better performance",
                "🔋 iOS Tip: Close other apps to free up memory before analysis",
                "📏 iOS Tip: Hold device horizontally and stay 6-8 feet from camera",
                "💡 iOS Tip: Ensure good lighting - iOS cameras work best in bright conditions",
                "⚡ iOS Tip: For best results, use a newer iPhone/iPad or try desktop browser",
                "🎯 iOS Tip: Record side-view running for most accurate analysis"
            ];
        } else {
            tips = window.DEMO_CONFIG?.TIPS || [
                "💡 Record from the side view for best results",
                "📱 Hold your phone horizontally",
                "🏃‍♂️ Ensure good lighting for better detection",
                "📏 Stand 6-10 feet away from camera",
                "⏱️ Record 5-15 seconds of running"
            ];
        }

        setInterval(() => {
            if (this.rotatingTip) {
                this.tipIndex = (this.tipIndex + 1) % tips.length;
                this.rotatingTip.textContent = tips[this.tipIndex];
            }
        }, isIOS ? 5000 : 4000); // Slower rotation for iOS to give more time to read
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
            // Validate file size
            const maxSize = window.DEMO_CONFIG?.MAX_VIDEO_SIZE || 100 * 1024 * 1024; // 100MB
            if (file.size > maxSize) {
                this.showError(`File too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`);
                return;
            }

            // Validate file type
            const supportedFormats = window.DEMO_CONFIG?.SUPPORTED_FORMATS || ['video/mp4', 'video/webm'];
            if (!supportedFormats.includes(file.type)) {
                this.showError('Unsupported file format. Please use MP4 or WebM files.');
                return;
            }

            this.loadVideoFromBlob(file);
        }
    }

    loadVideoFromBlob(blob) {
        const url = URL.createObjectURL(blob);
        this.inputVideo.src = url;
        this.inputVideo.style.display = 'block';
        this.currentVideo = this.inputVideo;
        
        // Add loading event listeners for debugging
        this.inputVideo.addEventListener('loadstart', () => {
            console.log('Video loading started');
        });
        
        this.inputVideo.addEventListener('loadedmetadata', () => {
            console.log(`Video metadata loaded: ${this.inputVideo.videoWidth}x${this.inputVideo.videoHeight}, duration: ${this.inputVideo.duration}s`);
        });
        
        this.inputVideo.addEventListener('loadeddata', () => {
            console.log('Video data loaded, ready for analysis');
            this.analyzeBtn.disabled = false;
            URL.revokeObjectURL(url);
        });
        
        this.inputVideo.addEventListener('error', (e) => {
            console.error('Video loading error:', e);
            this.showError('Failed to load video. Please try a different file format.');
        });
        
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
        this.analysisResults = [];
        this.frameCount = 0;

        try {
            await this.processVideoFrames();
            
            // Check if we have enough data for analysis
            if (this.analysisResults.length === 0) {
                this.showFeedback([{
                    type: 'error',
                    title: '❌ No Analysis Data',
                    message: 'Unable to detect any pose data in the video. Please ensure the person is clearly visible.',
                    suggestion: 'Try recording with better lighting, clearer view of the person, or a different angle.'
                }]);
            } else if (this.analysisResults.length < 5) {
                this.showFeedback([{
                    type: 'warning',
                    title: '⚠️ Limited Analysis Data',
                    message: `Only ${this.analysisResults.length} frames were analyzed. Results may not be accurate.`,
                    suggestion: 'For better results, try a longer video (10-15 seconds) with clearer view of the runner.'
                }]);
            } else {
                this.generateFeedback();
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
                // iOS detection and optimization
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
                const isLowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Failed to create canvas context'));
                    return;
                }
                
                // Aggressive canvas size reduction for iOS
                let scaleFactor = 1;
                if (isIOS) {
                    if (isLowEndDevice || isLowMemory) {
                        scaleFactor = 0.3; // Very aggressive for old devices
                    } else {
                        scaleFactor = 0.4; // Still aggressive for newer iOS
                    }
                } else if (isMobile) {
                    scaleFactor = 0.6;
                }
                
                canvas.width = (video.videoWidth || 640) * scaleFactor;
                canvas.height = (video.videoHeight || 480) * scaleFactor;
                
                // Set output canvas size
                this.outputCanvas.width = canvas.width;
                this.outputCanvas.height = canvas.height;

                video.currentTime = 0;
                
                // Aggressive iOS-optimized frame processing
                let frameInterval, maxProcessingTime, maxFrames;
                
                if (isIOS) {
                    if (isLowEndDevice || isLowMemory) {
                        frameInterval = 0.5; // Very slow for old devices
                        maxProcessingTime = 30000; // 30 seconds max
                        maxFrames = 15; // Very few frames
                    } else {
                        frameInterval = 0.4; // Slower for newer iOS
                        maxProcessingTime = 40000; // 40 seconds max
                        maxFrames = 20; // Fewer frames
                    }
                } else {
                    frameInterval = window.DEMO_CONFIG?.FRAME_INTERVAL || 0.1;
                    maxProcessingTime = window.DEMO_CONFIG?.PERFORMANCE?.MAX_PROCESSING_TIME || 90000;
                    maxFrames = 150;
                }
                
                let processInterval;
                let timeoutId;
                let frameCount = 0;
                let consecutiveErrors = 0;
                const maxConsecutiveErrors = isIOS ? 3 : 5; // Lower tolerance for iOS

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
                            // Wait longer for video to seek on iOS
                            await new Promise(resolve => setTimeout(resolve, isIOS ? 100 : 50));
                        }

                        // Draw with scaling
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        
                        if (this.pose) {
                            await this.pose.send({ image: canvas });
                        }

                        video.currentTime += frameInterval;
                        frameCount++;
                        consecutiveErrors = 0; // Reset error counter on success
                        
                        // Aggressive delays for iOS to prevent overwhelming the device
                        if (isIOS) {
                            if (isLowEndDevice || isLowMemory) {
                                // Very aggressive delays for old devices
                                await new Promise(resolve => setTimeout(resolve, 200));
                                // Force garbage collection every frame on low-end devices
                                if (window.gc && frameCount % 2 === 0) {
                                    window.gc();
                                }
                            } else {
                                // Regular delays for newer iOS
                                if (frameCount % 2 === 0) {
                                    await new Promise(resolve => setTimeout(resolve, 150));
                                }
                            }
                        }
                    } catch (error) {
                        console.error('Error processing frame:', error);
                        consecutiveErrors++;
                        
                        // If too many consecutive errors, stop processing
                        if (consecutiveErrors >= maxConsecutiveErrors) {
                            clearInterval(processInterval);
                            clearTimeout(timeoutId);
                            if (frameCount > 3) { // Lower threshold for iOS
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

                // Much slower processing interval for iOS
                let intervalDelay;
                if (isIOS) {
                    if (isLowEndDevice || isLowMemory) {
                        intervalDelay = 600; // Very slow for old devices
                    } else {
                        intervalDelay = 400; // Slower for newer iOS
                    }
                } else {
                    intervalDelay = 150;
                }
                
                processInterval = setInterval(processFrame, intervalDelay);
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

                    if (validLandmarks.length >= 25) { // Need at least key body points
                        // Analyze pose for running form issues
                        const analysis = this.analyzePose(validLandmarks);
                        if (analysis) {
                            this.analysisResults.push(analysis);
                            // Draw pose landmarks and connections
                            this.drawPose(validLandmarks, analysis);
                        }
                    } else {
                        console.warn('Insufficient valid landmarks detected');
                    }
                } catch (error) {
                    console.warn('Failed to analyze or draw pose:', error);
                }
            } else {
                console.warn('No pose landmarks detected in frame');
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
            lowKneeDrive: false,
            excessiveForwardLean: false,
            kneeAngle: 0,
            torsoAngle: 0,
            isRunning: false
        };

        try {
            // Check if person is in running position
            analysis.isRunning = this.detectRunningMotion(landmarks);
            
            if (analysis.isRunning) {
                // Analyze knee drive
                analysis.kneeAngle = this.calculateKneeAngle(landmarks);
                analysis.lowKneeDrive = analysis.kneeAngle < (config.KNEE_DRIVE_THRESHOLD || 45);

                // Analyze forward lean
                analysis.torsoAngle = this.calculateTorsoAngle(landmarks);
                analysis.excessiveForwardLean = analysis.torsoAngle < (config.FORWARD_LEAN_THRESHOLD || 160);
            }
        } catch (error) {
            console.error('Error analyzing pose:', error);
        }

        return analysis;
    }

    detectRunningMotion(landmarks) {
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        
        // Check if key points are visible
        if (!leftHip || !rightHip || !leftKnee || !rightKnee) return false;
        
        // Check visibility threshold
        const minVisibility = 0.5;
        if (leftHip.visibility < minVisibility || rightHip.visibility < minVisibility ||
            leftKnee.visibility < minVisibility || rightKnee.visibility < minVisibility) {
            return false;
        }
        
        // Check if person is roughly upright (hips above knees)
        const avgHipY = (leftHip.y + rightHip.y) / 2;
        const avgKneeY = (leftKnee.y + rightKnee.y) / 2;
        
        return avgHipY < avgKneeY;
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

        // Define pose connections
        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
            [11, 23], [12, 24], [23, 24], // Torso
            [23, 25], [25, 27], [24, 26], [26, 28], // Legs
            [27, 29], [29, 31], [28, 30], [30, 32] // Feet
        ];

        // Draw connections
        this.canvasCtx.strokeStyle = '#4ecdc4';
        this.canvasCtx.lineWidth = 3;
        
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            if (startPoint && endPoint && startPoint.visibility > 0.5 && endPoint.visibility > 0.5) {
                this.canvasCtx.beginPath();
                this.canvasCtx.moveTo(startPoint.x * width, startPoint.y * height);
                this.canvasCtx.lineTo(endPoint.x * width, endPoint.y * height);
                this.canvasCtx.stroke();
            }
        });

        // Draw landmarks
        landmarks.forEach((landmark, index) => {
            if (landmark.visibility > 0.5) {
                const x = landmark.x * width;
                const y = landmark.y * height;
                
                let color = '#ff6b6b';
                let radius = 4;
                
                // Highlight problematic joints
                if (analysis.lowKneeDrive && (index === 25 || index === 26)) {
                    color = '#ff3333';
                    radius = 6;
                }
                
                if (analysis.excessiveForwardLean && (index === 11 || index === 12)) {
                    color = '#ff3333';
                    radius = 6;
                }

                this.canvasCtx.fillStyle = color;
                this.canvasCtx.strokeStyle = '#fff';
                this.canvasCtx.lineWidth = 2;
                this.canvasCtx.beginPath();
                this.canvasCtx.arc(x, y, radius, 0, 2 * Math.PI);
                this.canvasCtx.fill();
                this.canvasCtx.stroke();
            }
        });
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
                suggestion: config.MESSAGES?.NO_RUNNING?.suggestion || 'Record a side-view video of yourself running for 5-15 seconds.'
            }]);
            return;
        }

        // Add warning for limited data
        const feedback = [];
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (runningFrames.length < 10) {
            let message = `Analysis based on ${runningFrames.length} running frames. For more accurate results, try a longer video.`;
            let suggestion = 'Record 10-15 seconds of continuous running for best analysis.';
            
            if (isIOS) {
                message = `Analysis based on ${runningFrames.length} running frames. iOS optimization limited frame count for performance.`;
                suggestion = 'On iOS: Use 5-10 second videos, close other apps, and ensure good lighting for better results.';
            }
            
            feedback.push({
                type: 'info',
                title: isIOS ? '📱 iOS Analysis Notice' : '📊 Limited Data Notice',
                message: message,
                suggestion: suggestion
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

        // Add positive feedback if form is good
        if (lowKneePercentage <= warningThreshold && forwardLeanPercentage <= warningThreshold) {
            feedback.push({
                type: 'good',
                title: config.MESSAGES?.GOOD_FORM?.title || '✅ Excellent Running Form!',
                message: config.MESSAGES?.GOOD_FORM?.message || 'Your running form shows good knee drive and posture. Keep up the excellent work!',
                suggestion: config.MESSAGES?.GOOD_FORM?.suggestion || 'Continue maintaining this form and consider working on other aspects like cadence and foot strike.'
            });
        }

        // Add metrics with data quality indicator
        const avgKneeAngle = runningFrames.reduce((sum, r) => sum + r.kneeAngle, 0) / runningFrames.length;
        const avgTorsoAngle = runningFrames.reduce((sum, r) => sum + r.torsoAngle, 0) / runningFrames.length;
        
        const dataQuality = runningFrames.length >= 20 ? 'High' : runningFrames.length >= 10 ? 'Medium' : 'Low';
        const qualityColor = dataQuality === 'High' ? '#28a745' : dataQuality === 'Medium' ? '#ffc107' : '#dc3545';
        
        feedback.push({
            type: 'info',
            title: '📊 Analysis Metrics',
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

        this.showFeedback(feedback);
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
    }

    reset() {
        // Stop camera and recording
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.isRecording) {
            this.stopVideoRecording();
        }
        
        // Reset UI
        this.cameraSection.style.display = 'none';
        this.inputVideo.style.display = 'none';
        this.feedbackSection.style.display = 'none';
        this.showProgress(false);
        this.analyzeBtn.disabled = true;
        
        // Clear canvas
        this.canvasCtx.clearRect(0, 0, this.outputCanvas.width, this.outputCanvas.height);
        
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