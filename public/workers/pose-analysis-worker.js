// RunForm.AI - Pose Analysis Web Worker
// Moves heavy pose processing off main thread for better performance

console.log('🔧 Pose Analysis Worker initialized');

// Import MediaPipe Pose (when available)
let pose = null;
let isInitialized = false;

// Worker message handler
self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    try {
        switch (type) {
            case 'INIT_POSE':
                await initializePose(data.config);
                break;
                
            case 'ANALYZE_FRAME':
                if (isInitialized && pose) {
                    await analyzeFrame(data.imageData, data.frameIndex);
                } else {
                    postMessage({
                        type: 'ERROR',
                        error: 'Pose not initialized'
                    });
                }
                break;
                
            case 'PROCESS_BATCH':
                await processBatchFrames(data.frames);
                break;
                
            case 'CLEANUP':
                cleanup();
                break;
                
            default:
                postMessage({
                    type: 'ERROR',
                    error: `Unknown message type: ${type}`
                });
        }
    } catch (error) {
        postMessage({
            type: 'ERROR',
            error: error.message,
            stack: error.stack
        });
    }
};

// Initialize MediaPipe Pose in worker
async function initializePose(config = {}) {
    try {
        // Dynamic import of MediaPipe
        if (!self.Pose) {
            await importScripts('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
        }
        
        pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });

        pose.setOptions({
            modelComplexity: config.modelComplexity || 1,
            smoothLandmarks: config.smoothLandmarks ?? true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: config.minDetectionConfidence || 0.5,
            minTrackingConfidence: config.minTrackingConfidence || 0.5,
            selfieMode: false
        });

        pose.onResults(onPoseResults);
        isInitialized = true;
        
        postMessage({
            type: 'POSE_INITIALIZED',
            success: true
        });
        
    } catch (error) {
        postMessage({
            type: 'POSE_INIT_ERROR',
            error: error.message
        });
    }
}

// Pose results handler
function onPoseResults(results) {
    if (!results.poseLandmarks) {
        postMessage({
            type: 'FRAME_RESULT',
            data: null,
            frameIndex: currentFrameIndex
        });
        return;
    }
    
    // Perform advanced pose analysis
    const analysis = performAdvancedAnalysis(results.poseLandmarks);
    
    postMessage({
        type: 'FRAME_RESULT',
        data: {
            landmarks: results.poseLandmarks,
            analysis: analysis,
            timestamp: Date.now()
        },
        frameIndex: currentFrameIndex
    });
}

let currentFrameIndex = 0;

// Analyze single frame
async function analyzeFrame(imageData, frameIndex) {
    currentFrameIndex = frameIndex;
    
    if (!pose) {
        throw new Error('Pose not initialized');
    }
    
    // Convert ImageData to format MediaPipe expects
    const canvas = new OffscreenCanvas(imageData.width, imageData.height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    
    await pose.send({ image: canvas });
}

// Process multiple frames in batch
async function processBatchFrames(frames) {
    postMessage({
        type: 'BATCH_STARTED',
        totalFrames: frames.length
    });
    
    for (let i = 0; i < frames.length; i++) {
        await analyzeFrame(frames[i].imageData, frames[i].frameIndex);
        
        // Report progress
        postMessage({
            type: 'BATCH_PROGRESS',
            current: i + 1,
            total: frames.length,
            percentage: ((i + 1) / frames.length) * 100
        });
        
        // Allow other operations
        await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    postMessage({
        type: 'BATCH_COMPLETE'
    });
}

// Advanced pose analysis (moved from main thread)
function performAdvancedAnalysis(landmarks) {
    if (!landmarks || landmarks.length < 33) return null;

    const analysis = {
        timestamp: Date.now(),
        issues: [],
        metrics: {},
        quality: 'good',
        angles: {},
        keyPoints: {}
    };

    try {
        // Get key landmarks
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

        // Calculate angles and metrics
        const shoulderMidpoint = {
            x: (leftShoulder.x + rightShoulder.x) / 2,
            y: (leftShoulder.y + rightShoulder.y) / 2
        };
        const hipMidpoint = {
            x: (leftHip.x + rightHip.x) / 2,
            y: (leftHip.y + rightHip.y) / 2
        };

        // Torso angle
        const torsoAngle = Math.atan2(
            shoulderMidpoint.x - hipMidpoint.x,
            hipMidpoint.y - shoulderMidpoint.y
        ) * (180 / Math.PI);
        
        analysis.angles.torsoLean = Math.abs(torsoAngle);
        analysis.metrics.torsoLean = Math.abs(torsoAngle);

        // Knee angles
        const leftKneeAngle = calculateKneeAngle(leftHip, leftKnee, leftAnkle);
        const rightKneeAngle = calculateKneeAngle(rightHip, rightKnee, rightAnkle);
        
        analysis.angles.leftKnee = leftKneeAngle;
        analysis.angles.rightKnee = rightKneeAngle;
        analysis.metrics.kneeHeight = Math.max(leftHip.y - leftKnee.y, rightHip.y - rightKnee.y);

        // Store key points
        analysis.keyPoints = {
            leftKnee: { x: leftKnee.x, y: leftKnee.y, angle: leftKneeAngle },
            rightKnee: { x: rightKnee.x, y: rightKnee.y, angle: rightKneeAngle },
            torso: { angle: Math.abs(torsoAngle) },
            visibility: visibleLandmarks.length / requiredLandmarks.length
        };

        // Issue detection
        if (Math.abs(torsoAngle) > 15) {
            analysis.issues.push({
                type: 'excessive_forward_lean',
                severity: Math.abs(torsoAngle) > 25 ? 'high' : 'medium',
                angle: Math.abs(torsoAngle)
            });
        }

        if (analysis.metrics.kneeHeight < 0.15) {
            analysis.issues.push({
                type: 'low_knee_drive',
                severity: analysis.metrics.kneeHeight < 0.1 ? 'high' : 'medium',
                height: analysis.metrics.kneeHeight
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
        console.error('Error in pose analysis:', error);
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

// Cleanup worker resources
function cleanup() {
    if (pose) {
        pose.close();
        pose = null;
    }
    isInitialized = false;
    
    postMessage({
        type: 'CLEANUP_COMPLETE'
    });
}

// Performance monitoring
let performanceMetrics = {
    framesProcessed: 0,
    averageProcessingTime: 0,
    memoryUsage: 0
};

function updatePerformanceMetrics(processingTime) {
    performanceMetrics.framesProcessed++;
    performanceMetrics.averageProcessingTime = 
        (performanceMetrics.averageProcessingTime + processingTime) / 2;
    
    if (self.performance && self.performance.memory) {
        performanceMetrics.memoryUsage = self.performance.memory.usedJSHeapSize;
    }
    
    // Report metrics every 10 frames
    if (performanceMetrics.framesProcessed % 10 === 0) {
        postMessage({
            type: 'PERFORMANCE_METRICS',
            metrics: { ...performanceMetrics }
        });
    }
}

console.log('✅ Pose Analysis Worker ready'); 