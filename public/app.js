// RunForm.AI - Main Application
console.log('🏃‍♂️ Starting RunForm.AI...');

// Global variables
let pose;
let camera;
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let analysisData = [];
let currentVideo = null;
let isAnalyzing = false;

// DOM Elements
const webcamBtn = document.getElementById('webcamBtn');
const uploadBtn = document.getElementById('uploadBtn');
const videoUpload = document.getElementById('videoUpload');
const webcamElement = document.getElementById('webcam');
const inputVideoElement = document.getElementById('inputVideo');
const outputCanvas = document.getElementById('outputCanvas');
const canvasCtx = outputCanvas.getContext('2d');
const startRecordingBtn = document.getElementById('startRecording');
const stopRecordingBtn = document.getElementById('stopRecording');
const analyzeBtn = document.getElementById('analyzeBtn');
const resetBtn = document.getElementById('resetBtn');
const exportBtn = document.getElementById('exportBtn');

// Section elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const cameraSection = document.getElementById('cameraSection');
const feedbackSection = document.getElementById('feedbackSection');

// Progress and loading elements
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const framesProcessed = document.getElementById('framesProcessed');
const issuesDetected = document.getElementById('issuesDetected');
const currentQuality = document.getElementById('currentQuality');
const loadingOverlay = document.getElementById('loadingOverlay');
const mediapipeLoading = document.getElementById('mediapipeLoading');
const analysisStatus = document.getElementById('analysisStatus');

// Tips rotation
const tips = [
    "Record from the side view for best results",
    "Use good lighting and avoid shadows",
    "Keep full body in frame throughout recording",
    "Record at least 5-10 seconds of running",
    "Ensure steady camera position",
    "Wear contrasting colors for better detection",
    "Avoid cluttered backgrounds if possible",
    "Record normal running pace, not too fast"
];
let currentTipIndex = 0;
const rotatingTip = document.getElementById('rotatingTip');

function rotateTips() {
    if (rotatingTip) {
        rotatingTip.style.opacity = '0.5';
        setTimeout(() => {
            currentTipIndex = (currentTipIndex + 1) % tips.length;
            rotatingTip.textContent = tips[currentTipIndex];
            rotatingTip.style.opacity = '1';
        }, 300);
    }
}

// Rotate tips every 5 seconds
setInterval(rotateTips, 5000);

// UI Helper Functions
function showSection(sectionToShow) {
    [step1, step2, step3].forEach(section => {
        if (section) section.style.display = 'none';
    });
    if (sectionToShow) sectionToShow.style.display = 'block';
}

function updateProgressOverlay(show, text = '', progress = 0, frames = 0, issues = 0, quality = 'Building...') {
    if (!progressSection) return;
    
    progressSection.style.display = show ? 'flex' : 'none';
    if (show) {
        if (progressText) progressText.textContent = text;
        if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        if (framesProcessed) framesProcessed.textContent = frames;
        if (issuesDetected) issuesDetected.textContent = issues;
        if (currentQuality) currentQuality.textContent = quality;
    }
}

function updateStatusIndicator(status, text, type = '') {
    if (!analysisStatus) return;
    
    analysisStatus.style.display = status ? 'block' : 'none';
    if (status) {
        const statusText = analysisStatus.querySelector('.status-text');
        if (statusText) statusText.textContent = text;
        
        // Remove existing type classes
        analysisStatus.classList.remove('processing', 'complete', 'error');
        if (type) analysisStatus.classList.add(type);
    }
}

function updateLoadingOverlay(show, title = 'Processing...', subtitle = 'Please wait...') {
    if (!loadingOverlay) return;
    
    loadingOverlay.style.display = show ? 'flex' : 'none';
    if (show) {
        const titleEl = loadingOverlay.querySelector('h3');
        const subtitleEl = loadingOverlay.querySelector('p');
        if (titleEl) titleEl.textContent = title;
        if (subtitleEl) subtitleEl.textContent = subtitle;
    }
}

// Initialize MediaPipe Pose
async function initializePose() {
    console.log('🤖 Initializing MediaPipe Pose...');
    
    try {
        pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        pose.setOptions({
            modelComplexity: 2, // Desktop-optimized for maximum accuracy
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onPoseResults);
        
        console.log('✅ MediaPipe Pose initialized successfully');
        if (mediapipeLoading) mediapipeLoading.style.display = 'none';
        updateStatusIndicator(true, 'Ready', 'complete');
        
    } catch (error) {
        console.error('❌ Failed to initialize MediaPipe Pose:', error);
        if (mediapipeLoading) {
            const titleEl = mediapipeLoading.querySelector('h3');
            const subtitleEl = mediapipeLoading.querySelector('p');
            if (titleEl) titleEl.textContent = '❌ Initialization Failed';
            if (subtitleEl) subtitleEl.textContent = 'Please refresh the page to try again.';
        }
        updateStatusIndicator(true, 'Error', 'error');
    }
}

// Pose detection results handler
function onPoseResults(results) {
    if (!isAnalyzing || !results.poseLandmarks) return;

    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    // Draw the video frame
    if (currentVideo) {
        canvasCtx.drawImage(currentVideo, 0, 0, outputCanvas.width, outputCanvas.height);
    }
    
    // Draw pose landmarks and connections
    if (results.poseLandmarks) {
        drawPoseLandmarks(results.poseLandmarks);
        
        // Analyze the pose for running form issues
        const frameAnalysis = analyzeRunningForm(results.poseLandmarks);
        if (frameAnalysis) {
            analysisData.push(frameAnalysis);
        }
    }
    
    canvasCtx.restore();
}

// Draw pose landmarks and connections
function drawPoseLandmarks(landmarks) {
    const connections = [
        [11, 13], [13, 15], // Left arm
        [12, 14], [14, 16], // Right arm
        [11, 12], // Shoulders
        [11, 23], [12, 24], // Torso
        [23, 24], // Hips
        [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
        [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
    ];

    // Draw connections
    canvasCtx.strokeStyle = '#4ECDC4';
    canvasCtx.lineWidth = 3;
    
    connections.forEach(([start, end]) => {
        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];
        
        if (startLandmark && endLandmark && 
            startLandmark.visibility > 0.3 && endLandmark.visibility > 0.3) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(startLandmark.x * outputCanvas.width, startLandmark.y * outputCanvas.height);
            canvasCtx.lineTo(endLandmark.x * outputCanvas.width, endLandmark.y * outputCanvas.height);
            canvasCtx.stroke();
        }
    });

    // Draw landmarks
    landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.3) {
            const x = landmark.x * outputCanvas.width;
            const y = landmark.y * outputCanvas.height;
            
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 4, 0, 2 * Math.PI);
            canvasCtx.fillStyle = '#FF6B6B';
            canvasCtx.fill();
            canvasCtx.strokeStyle = 'white';
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();
        }
    });
}

// Analyze running form
function analyzeRunningForm(landmarks) {
    if (!landmarks || landmarks.length < 33) return null;

    const analysis = {
        timestamp: Date.now(),
        issues: [],
        metrics: {},
        quality: 'good'
    };

    try {
        // Get key landmarks with visibility check
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        // Check visibility of key landmarks
        const requiredLandmarks = [nose, leftShoulder, rightShoulder, leftHip, rightHip, leftKnee, rightKnee];
        const visibleLandmarks = requiredLandmarks.filter(landmark => landmark && landmark.visibility > 0.3);
        
        if (visibleLandmarks.length < 5) {
            analysis.quality = 'poor';
            return analysis;
        }

        // 1. Analyze forward lean (torso angle)
        if (leftShoulder && rightShoulder && leftHip && rightHip) {
            const shoulderMidpoint = {
                x: (leftShoulder.x + rightShoulder.x) / 2,
                y: (leftShoulder.y + rightShoulder.y) / 2
            };
            const hipMidpoint = {
                x: (leftHip.x + rightHip.x) / 2,
                y: (leftHip.y + rightHip.y) / 2
            };

            const torsoAngle = Math.atan2(
                shoulderMidpoint.x - hipMidpoint.x,
                hipMidpoint.y - shoulderMidpoint.y
            ) * (180 / Math.PI);

            analysis.metrics.torsoLean = Math.abs(torsoAngle);

            // Desktop thresholds for precision
            if (Math.abs(torsoAngle) > 25) {
                analysis.issues.push({
                    type: 'excessive_forward_lean',
                    severity: Math.abs(torsoAngle) > 35 ? 'high' : 'medium',
                    angle: Math.abs(torsoAngle)
                });
            }
        }

        // 2. Analyze knee drive
        if (leftKnee && rightKnee && leftHip && rightHip) {
            const leftKneeHeight = leftHip.y - leftKnee.y;
            const rightKneeHeight = rightHip.y - rightKnee.y;
            const maxKneeHeight = Math.max(leftKneeHeight, rightKneeHeight);
            
            analysis.metrics.kneeHeight = maxKneeHeight;

            // Desktop precision thresholds
            if (maxKneeHeight < 0.15) {
                analysis.issues.push({
                    type: 'low_knee_drive',
                    severity: maxKneeHeight < 0.1 ? 'high' : 'medium',
                    height: maxKneeHeight
                });
            }
        }

        // 3. Analyze cadence and stride
        if (leftAnkle && rightAnkle) {
            const strideWidth = Math.abs(leftAnkle.x - rightAnkle.x);
            analysis.metrics.strideWidth = strideWidth;

            if (strideWidth > 0.3) {
                analysis.issues.push({
                    type: 'overstriding',
                    severity: strideWidth > 0.4 ? 'high' : 'medium',
                    width: strideWidth
                });
            }
        }

        // Set overall quality based on issues
        if (analysis.issues.length === 0) {
            analysis.quality = 'excellent';
        } else if (analysis.issues.length <= 2) {
            analysis.quality = 'good';
        } else {
            analysis.quality = 'needs_improvement';
        }

    } catch (error) {
        console.error('Error in pose analysis:', error);
        analysis.quality = 'poor';
    }

    return analysis;
}

// Event Listeners
webcamBtn?.addEventListener('click', async () => {
    updateStatusIndicator(true, 'Starting Camera...', 'processing');
    showSection(step1);
    cameraSection.style.display = 'block';
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        });
        
        webcamElement.srcObject = stream;
        
        // Initialize camera for MediaPipe
        camera = new Camera(webcamElement, {
            onFrame: async () => {
                if (pose && !isAnalyzing) {
                    await pose.send({ image: webcamElement });
                }
            },
            width: 640,
            height: 480
        });
        
        camera.start();
        updateStatusIndicator(true, 'Camera Ready', 'complete');
    } catch (error) {
        console.error('Camera access error:', error);
        updateStatusIndicator(true, 'Camera Error', 'error');
        alert('Camera access denied. Please allow camera permissions and try again.');
    }
});

uploadBtn?.addEventListener('click', () => {
    videoUpload?.click();
});

videoUpload?.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    updateStatusIndicator(true, 'Loading Video...', 'processing');
    showSection(step2);

    try {
        // Create object URL and set it to video element
        const videoUrl = URL.createObjectURL(file);
        inputVideoElement.src = videoUrl;
        currentVideo = inputVideoElement;

        // Wait for video to load
        await new Promise((resolve, reject) => {
            inputVideoElement.onloadeddata = () => {
                console.log('📹 Video loaded successfully');
                // Set canvas dimensions to match video
                outputCanvas.width = 640;
                outputCanvas.height = 480;
                
                // Enable analyze button
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.classList.add('pulse');
                }
                
                updateStatusIndicator(true, 'Video Ready', 'complete');
                resolve();
            };
            inputVideoElement.onerror = () => {
                console.error('❌ Failed to load video');
                reject(new Error('Failed to load video'));
            };
            
            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Video loading timeout'));
            }, 10000);
        });

    } catch (error) {
        console.error('Video upload error:', error);
        updateStatusIndicator(true, 'Upload Error', 'error');
        alert('Failed to load video. Please try a different file format (MP4, WebM, MOV).');
    }
});

startRecordingBtn?.addEventListener('click', async () => {
    if (!webcamElement.srcObject) return;

    try {
        const stream = webcamElement.srcObject;
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm'
        });

        recordedChunks = [];
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const videoUrl = URL.createObjectURL(blob);
            
            inputVideoElement.src = videoUrl;
            currentVideo = inputVideoElement;
            
            // Move to analysis section
            showSection(step2);
            
            // Enable analyze button
            if (analyzeBtn) {
                analyzeBtn.disabled = false;
            }
            
            updateStatusIndicator(true, 'Recording Complete', 'complete');
        };

        mediaRecorder.start(100); // Capture every 100ms
        isRecording = true;
        
        startRecordingBtn.style.display = 'none';
        stopRecordingBtn.style.display = 'inline-flex';
        
        // Show recording indicator
        const recordingIndicator = document.getElementById('recordingIndicator');
        if (recordingIndicator) recordingIndicator.style.display = 'flex';
        
        updateStatusIndicator(true, 'Recording...', 'processing');

    } catch (error) {
        console.error('Recording error:', error);
        updateStatusIndicator(true, 'Recording Error', 'error');
        alert('Failed to start recording. Please try again.');
    }
});

stopRecordingBtn?.addEventListener('click', () => {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        isRecording = false;
        
        startRecordingBtn.style.display = 'inline-flex';
        stopRecordingBtn.style.display = 'none';
        
        // Hide recording indicator
        const recordingIndicator = document.getElementById('recordingIndicator');
        if (recordingIndicator) recordingIndicator.style.display = 'none';
    }
});

analyzeBtn?.addEventListener('click', async () => {
    if (!currentVideo || !pose || isAnalyzing) return;

    isAnalyzing = true;
    analysisData = [];
    
    // Reset UI
    analyzeBtn.disabled = true;
    showSection(step2);
    updateProgressOverlay(true, 'Initializing analysis...', 0);
    updateStatusIndicator(true, 'Analyzing...', 'processing');

    try {
        console.log('🔍 Starting running form analysis...');
        
        // Set video dimensions
        outputCanvas.width = 640;
        outputCanvas.height = 480;
        
        const duration = currentVideo.duration;
        const frameInterval = 0.05; // 20 FPS for desktop precision
        const totalFrames = Math.floor(duration / frameInterval);
        let currentFrame = 0;
        
        updateProgressOverlay(true, 'Processing video frames...', 0);

        // Process video frame by frame
        for (let time = 0; time < duration; time += frameInterval) {
            if (!isAnalyzing) break; // Stop if analysis was cancelled
            
            currentVideo.currentTime = time;
            
            // Wait for video to seek to the correct time
            await new Promise(resolve => {
                const onSeeked = () => {
                    currentVideo.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                currentVideo.addEventListener('seeked', onSeeked);
            });

            // Send frame to MediaPipe
            await pose.send({ image: currentVideo });
            
            currentFrame++;
            const progress = (currentFrame / totalFrames) * 100;
            
            // Calculate current stats
            const issues = analysisData.reduce((count, frame) => count + frame.issues.length, 0);
            let quality = 'Building...';
            if (currentFrame >= 50) {
                if (analysisData.length >= currentFrame * 0.8) quality = 'Excellent';
                else if (analysisData.length >= currentFrame * 0.6) quality = 'Good';
                else if (analysisData.length >= currentFrame * 0.4) quality = 'Medium';
                else quality = 'Low';
            }
            
            updateProgressOverlay(true, 
                `Analyzing frame ${currentFrame} of ${totalFrames}...`, 
                progress, 
                analysisData.length, 
                issues, 
                quality
            );
            
            // Small delay to allow UI updates
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        console.log(`✅ Analysis complete! Processed ${analysisData.length} frames`);
        
        updateProgressOverlay(true, 'Generating results...', 100);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate and display results
        generateAnalysisResults();
        showSection(step3);
        updateProgressOverlay(false);
        updateStatusIndicator(true, 'Analysis Complete', 'complete');

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        updateProgressOverlay(false);
        updateStatusIndicator(true, 'Analysis Failed', 'error');
        alert('Analysis failed. Please try again with a different video.');
    } finally {
        isAnalyzing = false;
        analyzeBtn.disabled = false;
    }
});

resetBtn?.addEventListener('click', () => {
    // Stop any ongoing processes
    isAnalyzing = false;
    isRecording = false;
    
    // Reset data
    analysisData = [];
    currentVideo = null;
    
    // Stop camera if running
    if (camera) {
        camera.stop();
        camera = null;
    }
    
    // Stop webcam stream
    if (webcamElement.srcObject) {
        webcamElement.srcObject.getTracks().forEach(track => track.stop());
        webcamElement.srcObject = null;
    }
    
    // Reset UI
    showSection(step1);
    cameraSection.style.display = 'none';
    updateProgressOverlay(false);
    updateStatusIndicator(true, 'Ready', 'complete');
    
    // Reset buttons
    analyzeBtn.disabled = true;
    startRecordingBtn.style.display = 'inline-flex';
    stopRecordingBtn.style.display = 'none';
    
    // Reset form
    if (videoUpload) videoUpload.value = '';
    
    // Clear canvas
    canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    console.log('🔄 Application reset');
});

// Generate and display analysis results
function generateAnalysisResults() {
    if (!feedbackSection || analysisData.length === 0) return;

    const feedbackContent = document.getElementById('feedbackContent');
    if (!feedbackContent) return;

    // Calculate overall metrics
    const totalFrames = analysisData.length;
    const totalIssues = analysisData.reduce((sum, frame) => sum + frame.issues.length, 0);
    
    // Count issue types
    const issueTypes = {};
    const severityCounts = { low: 0, medium: 0, high: 0 };
    
    analysisData.forEach(frame => {
        frame.issues.forEach(issue => {
            if (!issueTypes[issue.type]) issueTypes[issue.type] = 0;
            issueTypes[issue.type]++;
            severityCounts[issue.severity]++;
        });
    });

    // Calculate data quality
    let qualityRating = 'Excellent';
    if (totalFrames < 50) qualityRating = 'Low';
    else if (totalFrames < 100) qualityRating = 'Medium';
    else if (totalFrames < 200) qualityRating = 'High';

    // Create results HTML
    let resultsHTML = '';

    // Metrics grid
    resultsHTML += `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${totalFrames}</div>
                <div class="metric-label">Frames Analyzed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${totalIssues}</div>
                <div class="metric-label">Issues Detected</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${qualityRating}</div>
                <div class="metric-label">Data Quality</div>
            </div>
        </div>
    `;

    // Overall assessment
    if (totalIssues === 0) {
        resultsHTML += `
            <div class="feedback-item good">
                <h4>🎉 Excellent Running Form!</h4>
                <p>Your running form analysis shows no significant biomechanical issues. You maintain good posture, appropriate knee drive, and efficient stride mechanics.</p>
                <p><strong>Recommendation:</strong> Continue with your current form and focus on consistency and endurance training.</p>
            </div>
        `;
    } else {
        resultsHTML += `
            <div class="feedback-item info">
                <h4>📊 Running Form Analysis Complete</h4>
                <p>We've analyzed ${totalFrames} frames of your running and identified ${totalIssues} areas for improvement.</p>
                <p>The following sections detail specific recommendations to optimize your running form.</p>
            </div>
        `;
    }

    // Issue-specific feedback
    if (issueTypes.excessive_forward_lean) {
        const severity = severityCounts.high > 0 ? 'error' : 'warning';
        resultsHTML += `
            <div class="feedback-item ${severity}">
                <h4>⚠️ Forward Lean Detected</h4>
                <p>Your analysis shows excessive forward lean in ${issueTypes.excessive_forward_lean} frames (${Math.round(issueTypes.excessive_forward_lean/totalFrames*100)}% of the time).</p>
                <p><strong>Impact:</strong> Excessive forward lean can lead to increased impact forces and potential lower back strain.</p>
                <p><strong>Recommendation:</strong> Focus on maintaining an upright posture with a slight forward lean (5-10 degrees). Practice running with your head up and shoulders relaxed.</p>
            </div>
        `;
    }

    if (issueTypes.low_knee_drive) {
        const severity = severityCounts.high > 0 ? 'error' : 'warning';
        resultsHTML += `
            <div class="feedback-item ${severity}">
                <h4>🦵 Low Knee Drive Detected</h4>
                <p>Low knee drive was detected in ${issueTypes.low_knee_drive} frames (${Math.round(issueTypes.low_knee_drive/totalFrames*100)}% of the time).</p>
                <p><strong>Impact:</strong> Low knee drive reduces running efficiency and can limit your speed potential.</p>
                <p><strong>Recommendation:</strong> Practice high knees drills and focus on driving your knees up during the lift phase of your stride. Aim for your thigh to be parallel to the ground at maximum knee height.</p>
            </div>
        `;
    }

    if (issueTypes.overstriding) {
        const severity = severityCounts.high > 0 ? 'error' : 'warning';
        resultsHTML += `
            <div class="feedback-item ${severity}">
                <h4>👟 Overstriding Detected</h4>
                <p>Overstriding was detected in ${issueTypes.overstriding} frames (${Math.round(issueTypes.overstriding/totalFrames*100)}% of the time).</p>
                <p><strong>Impact:</strong> Overstriding increases braking forces and can lead to increased injury risk.</p>
                <p><strong>Recommendation:</strong> Focus on landing with your foot closer to your center of gravity. Increase your cadence to 170-180 steps per minute and take shorter, quicker steps.</p>
            </div>
        `;
    }

    // Data quality information
    resultsHTML += `
        <div class="feedback-item info">
            <h4>📈 Analysis Quality Report</h4>
            <p><strong>Data Quality:</strong> ${qualityRating}</p>
            <p><strong>Frames Processed:</strong> ${totalFrames} frames from your video</p>
            <p><strong>Detection Accuracy:</strong> High-precision MediaPipe pose detection</p>
            <p>This analysis is based on biomechanical assessment of your running form. For personalized training plans, consider consulting with a running coach or sports physiologist.</p>
        </div>
    `;

    feedbackContent.innerHTML = resultsHTML;
}

exportBtn?.addEventListener('click', () => {
    if (analysisData.length === 0) {
        alert('No analysis data to export. Please run an analysis first.');
        return;
    }

    // Create comprehensive report
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalFrames: analysisData.length,
            totalIssues: analysisData.reduce((sum, frame) => sum + frame.issues.length, 0),
            dataQuality: analysisData.length >= 200 ? 'Excellent' : 
                        analysisData.length >= 100 ? 'High' :
                        analysisData.length >= 50 ? 'Medium' : 'Low'
        },
        detailedAnalysis: analysisData,
        recommendations: generateRecommendations()
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `runform-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📊 Analysis exported successfully');
});

function generateRecommendations() {
    const recommendations = [];
    
    if (analysisData.length === 0) return recommendations;

    // Count issue types
    const issueTypes = {};
    analysisData.forEach(frame => {
        frame.issues.forEach(issue => {
            if (!issueTypes[issue.type]) issueTypes[issue.type] = 0;
            issueTypes[issue.type]++;
        });
    });

    // Generate specific recommendations
    if (issueTypes.excessive_forward_lean) {
        recommendations.push({
            issue: 'Forward Lean',
            priority: 'High',
            exercises: ['Wall push-ups for posture', 'Core strengthening', 'Posture drills'],
            technique: 'Focus on running tall with eyes looking ahead, not down'
        });
    }

    if (issueTypes.low_knee_drive) {
        recommendations.push({
            issue: 'Knee Drive',
            priority: 'Medium',
            exercises: ['High knees drill', 'Butt kicks', 'A-skips', 'B-skips'],
            technique: 'Practice lifting knees to hip height during training runs'
        });
    }

    if (issueTypes.overstriding) {
        recommendations.push({
            issue: 'Stride Length',
            priority: 'High',
            exercises: ['Cadence drills', 'Short stride intervals', 'Metronome training'],
            technique: 'Aim for 170-180 steps per minute with midfoot landing'
        });
    }

    return recommendations;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 DOM Content Loaded, initializing RunForm.AI...');
    
    // Show initial section
    showSection(step1);
    
    // Initialize MediaPipe
    await initializePose();
    
    console.log('✅ RunForm.AI ready!');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRecording) {
        // Pause recording if page becomes hidden
        console.log('⏸️ Page hidden, pausing recording...');
    }
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    updateStatusIndicator(true, 'Application Error', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
    updateStatusIndicator(true, 'Processing Error', 'error');
});

console.log('✅ RunForm.AI application loaded successfully!'); 