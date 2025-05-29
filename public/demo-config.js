// Demo Configuration for RunForm.AI - Desktop Optimized
const DEMO_CONFIG = {
    // Analysis thresholds
    KNEE_DRIVE_THRESHOLD: 45, // degrees
    FORWARD_LEAN_THRESHOLD: 160, // degrees
    
    // Warning thresholds (percentage of frames)
    WARNING_THRESHOLD: 10,
    ERROR_THRESHOLD: 30,
    
    // Video processing settings - Desktop optimized
    FRAME_INTERVAL: 0.05, // Higher frequency for better analysis (20 FPS)
    MAX_VIDEO_SIZE: 200 * 1024 * 1024, // 200MB for high-quality videos
    SUPPORTED_FORMATS: ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv'],
    
    // MediaPipe settings - More lenient for better detection
    MEDIAPIPE_CONFIG: {
        modelComplexity: 1, // Reduced from 2 for better compatibility
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5, // Reduced from 0.7 for more lenient detection
        minTrackingConfidence: 0.5, // Reduced from 0.7 for more lenient tracking
        staticImageMode: false,
        upperBodyOnly: false
    },
    
    // Camera settings - High quality for desktop
    CAMERA_CONFIG: {
        width: 1280,
        height: 720,
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
            suggestion: 'Record a side-view video of yourself running for 10-20 seconds.'
        }
    },
    
    // Desktop-optimized tips
    TIPS: [
        "💡 Record from the side view for best results",
        "📱 Hold your camera horizontally",
        "🏃‍♂️ Ensure good lighting for better detection",
        "📏 Stand 6-10 feet away from camera",
        "⏱️ Record 10-20 seconds of running",
        "🎯 Keep your full body in frame throughout the video",
        "🖥️ Use Chrome or Firefox for optimal performance",
        "📹 Higher resolution videos provide better analysis",
        "🔍 Ensure the runner is clearly visible throughout",
        "⚡ Desktop browsers provide the most accurate analysis"
    ],
    
    // Performance metrics - Desktop optimized
    PERFORMANCE: {
        TARGET_FPS: 20, // Higher FPS for better analysis
        MAX_PROCESSING_TIME: 120000, // 2 minutes for comprehensive analysis
        MEMORY_WARNING_THRESHOLD: 200 * 1024 * 1024 // 200MB
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
    console.log('RunForm.AI configured for desktop optimization');
} 