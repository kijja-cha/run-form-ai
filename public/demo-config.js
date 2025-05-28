// Demo Configuration for RunForm.AI
const DEMO_CONFIG = {
    // Analysis thresholds
    KNEE_DRIVE_THRESHOLD: 45, // degrees
    FORWARD_LEAN_THRESHOLD: 160, // degrees
    
    // Warning thresholds (percentage of frames)
    WARNING_THRESHOLD: 10,
    ERROR_THRESHOLD: 30,
    
    // Video processing settings
    FRAME_INTERVAL: 0.1, // seconds between analyzed frames
    MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
    SUPPORTED_FORMATS: ['video/mp4', 'video/webm', 'video/mov', 'video/avi'],
    
    // MediaPipe settings
    MEDIAPIPE_CONFIG: {
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    },
    
    // Camera settings
    CAMERA_CONFIG: {
        width: 640,
        height: 480,
        frameRate: 30
    },
    
    // Pose landmark indices (MediaPipe standard)
    LANDMARKS: {
        LEFT_SHOULDER: 11,
        RIGHT_SHOULDER: 12,
        LEFT_HIP: 23,
        RIGHT_HIP: 24,
        LEFT_KNEE: 25,
        RIGHT_KNEE: 26,
        LEFT_ANKLE: 27,
        RIGHT_ANKLE: 28
    },
    
    // UI messages
    MESSAGES: {
        GOOD_FORM: {
            title: '✅ Excellent Running Form!',
            message: 'Your running form shows good knee drive and posture. Keep up the excellent work!',
            suggestion: 'Continue maintaining this form and consider working on other aspects like cadence and foot strike.'
        },
        LOW_KNEE_DRIVE: {
            title: '🚨 Low Knee Drive Detected',
            suggestion: 'Focus on lifting your knees to at least 45° during your stride. Practice high knees drills to improve this.'
        },
        FORWARD_LEAN: {
            title: '🚨 Excessive Forward Lean',
            suggestion: 'Focus on maintaining an upright posture. Imagine a string pulling you up from the top of your head.'
        },
        NO_RUNNING: {
            title: '⚠️ No Running Motion Detected',
            message: 'Please ensure you are running in the video for accurate analysis.',
            suggestion: 'Record a side-view video of yourself running for 5-15 seconds.'
        }
    },
    
    // Demo tips
    TIPS: [
        "📱 Hold your phone horizontally for better analysis",
        "🏃‍♂️ Record from the side view (90° angle)",
        "💡 Ensure good lighting for better pose detection",
        "📏 Stand 6-10 feet away from the camera",
        "⏱️ Record 5-15 seconds of continuous running",
        "🎯 Keep your full body in frame throughout the video"
    ],
    
    // Performance metrics
    PERFORMANCE: {
        TARGET_FPS: 10,
        MAX_PROCESSING_TIME: 60000, // 60 seconds
        MEMORY_WARNING_THRESHOLD: 100 * 1024 * 1024 // 100MB
    },

    // Validation function
    validate: function() {
        const required = ['KNEE_DRIVE_THRESHOLD', 'FORWARD_LEAN_THRESHOLD', 'MEDIAPIPE_CONFIG'];
        const missing = required.filter(key => !(key in this));
        if (missing.length > 0) {
            console.warn('Missing required config keys:', missing);
            return false;
        }
        return true;
    }
};

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DEMO_CONFIG;
} else if (typeof window !== 'undefined') {
    window.DEMO_CONFIG = DEMO_CONFIG;
    // Validate configuration on load
    if (!DEMO_CONFIG.validate()) {
        console.error('Configuration validation failed');
    }
} 