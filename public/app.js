// RunForm.AI - Phase 2: AI Personal Running Form Coach
console.log('🏃‍♂️ Starting RunForm.AI Phase 2...');

// Global variables
let camera;
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let analysisData = [];
let currentVideo = null;
let isAnalyzing = false;
let kneeAngleChart = null;
let torsoAngleChart = null;

// Make pose a global window property
window.pose = null;

// Elite runner baseline data
const BASELINE_DATA = {
    kneeAngle: {
        optimal: { min: 85, max: 125 },
        elite: { min: 90, max: 120 }
    },
    torsoLean: {
        optimal: { min: 5, max: 15 },
        elite: { min: 8, max: 12 }
    },
    cadence: {
        optimal: { min: 170, max: 190 },
        elite: { min: 175, max: 185 }
    }
};

// Coaching drills database
const COACHING_DRILLS = {
    low_knee_drive: [
        'High knees drill (30 seconds x 3 sets)',
        'A-skips for knee lift technique',
        'Wall knee drives (10 reps each leg)',
        'Marching drills with exaggerated knee lift'
    ],
    excessive_forward_lean: [
        'Wall posture drills',
        'Core strengthening (planks, dead bugs)',
        'Posture-focused running drills',
        'Tall running technique practice'
    ],
    overstriding: [
        'Cadence drills with metronome',
        'Short stride intervals',
        'Midfoot landing practice',
        'Quick feet drills'
    ]
};

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

// Section elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const cameraSection = document.getElementById('cameraSection');
const videoPreviewSection = document.getElementById('videoPreviewSection');
const feedbackSection = document.getElementById('feedbackSection');

// Phase 2 elements
const videoDuration = document.getElementById('videoDuration');
const videoQuality = document.getElementById('videoQuality');
const metricsOverview = document.getElementById('metricsOverview');
const frameSnapshots = document.getElementById('frameSnapshots');
const snapshotsGrid = document.getElementById('snapshotsGrid');
const chartsSection = document.getElementById('chartsSection');
const coachingSection = document.getElementById('coachingSection');
const coachingContent = document.getElementById('coachingContent');
const dataQualitySection = document.getElementById('dataQualitySection');
const dataQualityContent = document.getElementById('dataQualityContent');

// Export buttons
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportImageBtn = document.getElementById('exportImageBtn');
const shareBtn = document.getElementById('shareBtn');

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
    "Record normal running pace for accurate analysis"
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

function updateProgressOverlay(show, text = '', progress = 0, frames = 0, insights = 0, quality = 'Building...') {
    if (!progressSection) return;
    
    progressSection.style.display = show ? 'flex' : 'none';
    if (show) {
        if (progressText) progressText.textContent = text;
        if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        if (framesProcessed) framesProcessed.textContent = frames;
        if (issuesDetected) issuesDetected.textContent = insights;
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

function updateVideoInfo(video) {
    if (videoDuration && video.duration) {
        videoDuration.textContent = `${Math.round(video.duration)}s`;
    }
    
    if (videoQuality) {
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        let quality = 'Unknown';
        
        if (width >= 1920) quality = 'High (HD+)';
        else if (width >= 1280) quality = 'Good (HD)';
        else if (width >= 720) quality = 'Medium';
        else if (width > 0) quality = 'Low';
        
        videoQuality.textContent = quality;
    }
}

// Initialize MediaPipe Pose
async function initializePose() {
    console.log('🤖 Initializing MediaPipe Pose...');
    
    try {
        window.pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        window.pose.setOptions({
            modelComplexity: 2,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
            selfieMode: false
        });

        window.pose.onResults(onPoseResults);
        
        console.log('✅ MediaPipe Pose initialized successfully');
        return window.pose;
    } catch (error) {
        console.error('❌ Failed to initialize MediaPipe Pose:', error);
        throw error;
    }
}

// Enhanced pose detection results handler
function onPoseResults(results) {
    if (!isAnalyzing || !results.poseLandmarks) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    if (currentVideo) {
        canvasCtx.drawImage(currentVideo, 0, 0, outputCanvas.width, outputCanvas.height);
    }
    
    if (results.poseLandmarks) {
        drawEnhancedPoseLandmarks(results.poseLandmarks);
        
        const frameAnalysis = analyzeRunningFormAdvanced(results.poseLandmarks);
        if (frameAnalysis) {
            analysisData.push(frameAnalysis);
        }
    }
    
    canvasCtx.restore();
}

// Enhanced pose landmark drawing
function drawEnhancedPoseLandmarks(landmarks) {
    const connections = [
        [11, 13], [13, 15], // Left arm
        [12, 14], [14, 16], // Right arm
        [11, 12], // Shoulders
        [11, 23], [12, 24], // Torso
        [23, 24], // Hips
        [23, 25], [25, 27], [27, 29], [29, 31], // Left leg
        [24, 26], [26, 28], [28, 30], [30, 32], // Right leg
    ];

    // Draw connections with dynamic colors
    connections.forEach(([start, end]) => {
        const startLandmark = landmarks[start];
        const endLandmark = landmarks[end];
        
        if (startLandmark && endLandmark && 
            startLandmark.visibility > 0.3 && endLandmark.visibility > 0.3) {
            
            // Color based on body part
            let color = '#4ECDC4';
            if ([23, 25, 27, 29, 31, 24, 26, 28, 30, 32].includes(start) || 
                [23, 25, 27, 29, 31, 24, 26, 28, 30, 32].includes(end)) {
                color = '#FF6B6B'; // Legs in red for running analysis
            }
            
            canvasCtx.strokeStyle = color;
            canvasCtx.lineWidth = 3;
            canvasCtx.beginPath();
            canvasCtx.moveTo(startLandmark.x * outputCanvas.width, startLandmark.y * outputCanvas.height);
            canvasCtx.lineTo(endLandmark.x * outputCanvas.width, endLandmark.y * outputCanvas.height);
            canvasCtx.stroke();
        }
    });

    // Draw landmarks with enhanced styling
    landmarks.forEach((landmark, index) => {
        if (landmark.visibility > 0.3) {
            const x = landmark.x * outputCanvas.width;
            const y = landmark.y * outputCanvas.height;
            
            canvasCtx.beginPath();
            canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
            
            // Different colors for key points
            if ([25, 26].includes(index)) { // Knees
                canvasCtx.fillStyle = '#FFD700';
            } else if ([11, 12, 23, 24].includes(index)) { // Torso
                canvasCtx.fillStyle = '#FF6B6B';
            } else {
                canvasCtx.fillStyle = '#4ECDC4';
            }
            
            canvasCtx.fill();
            canvasCtx.strokeStyle = 'white';
            canvasCtx.lineWidth = 2;
            canvasCtx.stroke();
        }
    });
}

// Advanced running form analysis
function analyzeRunningFormAdvanced(landmarks) {
    if (!landmarks || landmarks.length < 33) return null;

    const analysis = {
        timestamp: Date.now(),
        frameIndex: analysisData.length,
        issues: [],
        metrics: {},
        quality: 'good',
        angles: {},
        keyPoints: {}
    };

    try {
        // Get key landmarks
        const nose = landmarks[0];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftKnee = landmarks[25];
        const rightKnee = landmarks[26];
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];

        // Check visibility
        const requiredLandmarks = [leftShoulder, rightShoulder, leftHip, rightHip, leftKnee, rightKnee];
        const visibleLandmarks = requiredLandmarks.filter(landmark => landmark && landmark.visibility > 0.3);
        
        if (visibleLandmarks.length < 5) {
            analysis.quality = 'poor';
            return analysis;
        }

        // Calculate midpoints
        const shoulderMidpoint = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
        };
        const hipMidpoint = {
            x: (leftHip.x + rightHip.x) / 2,
            y: (leftHip.y + rightHip.y) / 2
        };

        // 1. Torso angle analysis
        const torsoAngle = Math.atan2(
            shoulderMidpoint.x - hipMidpoint.x,
            hipMidpoint.y - shoulderMidpoint.y
        ) * (180 / Math.PI);
        
        analysis.angles.torsoLean = Math.abs(torsoAngle);
        analysis.metrics.torsoLean = Math.abs(torsoAngle);

        // 2. Knee angle analysis (both legs)
        const leftKneeAngle = calculateKneeAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateKneeAngle(rightHip, rightKnee, rightAnkle);
        
        analysis.angles.leftKnee = leftKneeAngle;
        analysis.angles.rightKnee = rightKneeAngle;
        analysis.metrics.kneeHeight = Math.max(leftHip.y - leftKnee.y, rightHip.y - rightKnee.y);

        // 3. Stride analysis
        if (leftAnkle && rightAnkle) {
            const strideWidth = Math.abs(leftAnkle.x - rightAnkle.x);
            analysis.metrics.strideWidth = strideWidth;
        }

        // Store key points for snapshots
        analysis.keyPoints = {
            leftKnee: { x: leftKnee.x, y: leftKnee.y, angle: leftKneeAngle },
            rightKnee: { x: rightKnee.x, y: rightKnee.y, angle: rightKneeAngle },
            torso: { angle: Math.abs(torsoAngle) },
            visibility: visibleLandmarks.length / requiredLandmarks.length
        };

        // Issue detection with baseline comparison
        if (Math.abs(torsoAngle) > BASELINE_DATA.torsoLean.optimal.max) {
            analysis.issues.push({
                type: 'excessive_forward_lean',
                severity: Math.abs(torsoAngle) > 25 ? 'high' : 'medium',
                angle: Math.abs(torsoAngle),
                baseline: BASELINE_DATA.torsoLean.optimal.max
            });
        }

        if (analysis.metrics.kneeHeight < 0.15) {
            analysis.issues.push({
                type: 'low_knee_drive',
                severity: analysis.metrics.kneeHeight < 0.1 ? 'high' : 'medium',
                height: analysis.metrics.kneeHeight
            });
        }

        if (analysis.metrics.strideWidth > 0.3) {
            analysis.issues.push({
                type: 'overstriding',
                severity: analysis.metrics.strideWidth > 0.4 ? 'high' : 'medium',
                width: analysis.metrics.strideWidth
            });
        }

        // Quality assessment
        if (analysis.issues.length === 0) {
            analysis.quality = 'excellent';
        } else if (analysis.issues.length <= 2) {
            analysis.quality = 'good';
        } else {
            analysis.quality = 'needs_improvement';
        }

    } catch (error) {
        console.error('Error in advanced pose analysis:', error);
        analysis.quality = 'poor';
    }

    return analysis;
}

function calculateKneeAngle(hip, knee, ankle) {
    if (!hip || !knee || !ankle) return 0;
    
    const vector1 = { x: hip.x - knee.x, y: hip.y - knee.y };
    const vector2 = { x: ankle.x - knee.x, y: ankle.y - knee.y };
    
    const dot = vector1.x * vector2.x + vector1.y * vector2.y;
    const mag1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y);
    const mag2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y);
    
    const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
    return isNaN(angle) ? 0 : angle;
} 