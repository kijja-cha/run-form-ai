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

// Demo Configuration for RunForm.AI Phase 2
console.log('🧪 Loading Demo Configuration...');

// Demo mode toggle
let isDemoMode = false;

// Sample analysis data for demo/testing
const DEMO_ANALYSIS_DATA = [
    {
        timestamp: Date.now(),
        frameIndex: 0,
        issues: [{ type: 'low_knee_drive', severity: 'medium', height: 0.12 }],
        metrics: { kneeHeight: 0.12, torsoLean: 8.5, strideWidth: 0.25 },
        quality: 'good',
        angles: { leftKnee: 95, rightKnee: 98, torsoLean: 8.5 },
        keyPoints: { leftKnee: { x: 0.3, y: 0.6, angle: 95 }, rightKnee: { x: 0.7, y: 0.6, angle: 98 }, torso: { angle: 8.5 }, visibility: 0.9 }
    },
    {
        timestamp: Date.now() + 100,
        frameIndex: 1,
        issues: [],
        metrics: { kneeHeight: 0.18, torsoLean: 10.2, strideWidth: 0.22 },
        quality: 'excellent',
        angles: { leftKnee: 110, rightKnee: 108, torsoLean: 10.2 },
        keyPoints: { leftKnee: { x: 0.3, y: 0.5, angle: 110 }, rightKnee: { x: 0.7, y: 0.5, angle: 108 }, torso: { angle: 10.2 }, visibility: 0.95 }
    },
    {
        timestamp: Date.now() + 200,
        frameIndex: 2,
        issues: [{ type: 'excessive_forward_lean', severity: 'low', angle: 18 }],
        metrics: { kneeHeight: 0.16, torsoLean: 18.3, strideWidth: 0.28 },
        quality: 'good',
        angles: { leftKnee: 102, rightKnee: 105, torsoLean: 18.3 },
        keyPoints: { leftKnee: { x: 0.3, y: 0.55, angle: 102 }, rightKnee: { x: 0.7, y: 0.55, angle: 105 }, torso: { angle: 18.3 }, visibility: 0.85 }
    },
    {
        timestamp: Date.now() + 300,
        frameIndex: 3,
        issues: [],
        metrics: { kneeHeight: 0.20, torsoLean: 12.1, strideWidth: 0.24 },
        quality: 'excellent',
        angles: { leftKnee: 115, rightKnee: 112, torsoLean: 12.1 },
        keyPoints: { leftKnee: { x: 0.3, y: 0.48, angle: 115 }, rightKnee: { x: 0.7, y: 0.48, angle: 112 }, torso: { angle: 12.1 }, visibility: 0.92 }
    },
    {
        timestamp: Date.now() + 400,
        frameIndex: 4,
        issues: [{ type: 'overstriding', severity: 'medium', width: 0.35 }],
        metrics: { kneeHeight: 0.14, torsoLean: 15.7, strideWidth: 0.35 },
        quality: 'good',
        angles: { leftKnee: 88, rightKnee: 92, torsoLean: 15.7 },
        keyPoints: { leftKnee: { x: 0.3, y: 0.62, angle: 88 }, rightKnee: { x: 0.7, y: 0.62, angle: 92 }, torso: { angle: 15.7 }, visibility: 0.88 }
    }
];

// Sample coaching recommendations
const DEMO_COACHING_INSIGHTS = [
    {
        title: '🌟 Overall Assessment',
        insight: 'Good foundation! Your running form shows consistency with room for targeted improvements.',
        recommendations: [
            'Focus on maintaining higher knee drive',
            'Work on consistent posture throughout stride',
            'Practice cadence drills for efficiency'
        ]
    },
    {
        title: '🦵 Knee Drive Optimization',
        insight: 'Your knee drive varies throughout your stride. Consistent knee lift will improve efficiency.',
        recommendations: [
            'High knees drill (30 seconds x 3 sets)',
            'A-skips for knee lift technique',
            'Wall knee drives (10 reps each leg)'
        ]
    }
];

// Developer mode features
function enableDemoMode() {
    console.log('🎭 Demo mode enabled');
    isDemoMode = true;
    
    // Add demo button to UI
    const demoButton = document.createElement('button');
    demoButton.textContent = '🧪 Demo Analysis';
    demoButton.className = 'control-button secondary';
    demoButton.style.position = 'fixed';
    demoButton.style.top = '80px';
    demoButton.style.right = '24px';
    demoButton.style.zIndex = '1001';
    demoButton.onclick = runDemoAnalysis;
    document.body.appendChild(demoButton);
}

function runDemoAnalysis() {
    console.log('🎬 Running demo analysis...');
    
    // Set demo data
    analysisData = [...DEMO_ANALYSIS_DATA];
    
    // Show results section
    showSection(step3);
    
    // Generate all Phase 2 features with demo data
    setTimeout(() => {
        generateAllResults();
        updateStatusIndicator(true, 'Demo Complete', 'complete');
    }, 500);
}

// Advanced coaching mode toggle
function enableCoachingMode() {
    console.log('🏆 Advanced coaching mode enabled');
    
    // Add coaching mode indicator
    const coachingIndicator = document.createElement('div');
    coachingIndicator.innerHTML = '🏆 Coach Mode';
    coachingIndicator.style.position = 'fixed';
    coachingIndicator.style.top = '120px';
    coachingIndicator.style.right = '24px';
    coachingIndicator.style.background = 'rgba(102, 126, 234, 0.9)';
    coachingIndicator.style.color = 'white';
    coachingIndicator.style.padding = '8px 16px';
    coachingIndicator.style.borderRadius = '12px';
    coachingIndicator.style.fontSize = '0.9rem';
    coachingIndicator.style.fontWeight = '500';
    coachingIndicator.style.zIndex = '1001';
    document.body.appendChild(coachingIndicator);
    
    // Enhanced baseline comparison
    BASELINE_DATA.expert = {
        kneeAngle: { min: 95, max: 115 },
        torsoLean: { min: 6, max: 10 },
        cadence: { min: 180, max: 188 }
    };
}

// Developer tools
function enableDeveloperMode() {
    console.log('👨‍💻 Developer mode enabled');
    
    // Add developer controls
    const devPanel = document.createElement('div');
    devPanel.className = 'dev-panel';
    devPanel.style.position = 'fixed';
    devPanel.style.bottom = '24px';
    devPanel.style.right = '24px';
    devPanel.style.background = 'rgba(0,0,0,0.9)';
    devPanel.style.color = 'white';
    devPanel.style.padding = '16px';
    devPanel.style.borderRadius = '12px';
    devPanel.style.fontSize = '0.85rem';
    devPanel.style.zIndex = '1001';
    devPanel.style.maxWidth = '300px';
    
    devPanel.innerHTML = `
        <h4 style="margin: 0 0 12px 0; color: #4ECDC4;">🛠️ Developer Tools</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <button onclick="showAnalysisData()" style="padding: 6px 12px; border: none; border-radius: 6px; background: #667eea; color: white; cursor: pointer;">📊 Show Analysis Data</button>
            <button onclick="exportAnalysisJSON()" style="padding: 6px 12px; border: none; border-radius: 6px; background: #f093fb; color: white; cursor: pointer;">💾 Export JSON</button>
            <button onclick="adjustBaseline()" style="padding: 6px 12px; border: none; border-radius: 6px; background: #4facfe; color: white; cursor: pointer;">⚙️ Adjust Baseline</button>
            <button onclick="toggleDevPanel()" style="padding: 6px 12px; border: none; border-radius: 6px; background: #fd79a8; color: white; cursor: pointer;">❌ Close</button>
        </div>
    `;
    
    document.body.appendChild(devPanel);
    window.devPanel = devPanel;
}

function showAnalysisData() {
    if (!analysisData || analysisData.length === 0) {
        alert('No analysis data available');
        return;
    }
    
    const summary = {
        totalFrames: analysisData.length,
        averageQuality: analysisData.filter(f => f.quality === 'excellent' || f.quality === 'good').length / analysisData.length,
        issueBreakdown: analysisData.reduce((acc, frame) => {
            frame.issues.forEach(issue => {
                acc[issue.type] = (acc[issue.type] || 0) + 1;
            });
            return acc;
        }, {}),
        angleRanges: {
            kneeAngle: {
                min: Math.min(...analysisData.map(f => Math.min(f.angles?.leftKnee || 180, f.angles?.rightKnee || 180))),
                max: Math.max(...analysisData.map(f => Math.max(f.angles?.leftKnee || 0, f.angles?.rightKnee || 0)))
            },
            torsoLean: {
                min: Math.min(...analysisData.map(f => f.angles?.torsoLean || 90)),
                max: Math.max(...analysisData.map(f => f.angles?.torsoLean || 0))
            }
        }
    };
    
    console.table(summary);
    alert(`Analysis Summary:\n${JSON.stringify(summary, null, 2)}`);
}

function exportAnalysisJSON() {
    if (!analysisData || analysisData.length === 0) {
        alert('No analysis data to export');
        return;
    }
    
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: 'RunForm.AI Phase 2',
            totalFrames: analysisData.length
        },
        baseline: BASELINE_DATA,
        analysisData: analysisData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `runform-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

function adjustBaseline() {
    const newKneeMin = prompt('Knee Angle Min (current: ' + BASELINE_DATA.kneeAngle.optimal.min + ')', BASELINE_DATA.kneeAngle.optimal.min);
    const newKneeMax = prompt('Knee Angle Max (current: ' + BASELINE_DATA.kneeAngle.optimal.max + ')', BASELINE_DATA.kneeAngle.optimal.max);
    const newTorsoMin = prompt('Torso Lean Min (current: ' + BASELINE_DATA.torsoLean.optimal.min + ')', BASELINE_DATA.torsoLean.optimal.min);
    const newTorsoMax = prompt('Torso Lean Max (current: ' + BASELINE_DATA.torsoLean.optimal.max + ')', BASELINE_DATA.torsoLean.optimal.max);
    
    if (newKneeMin) BASELINE_DATA.kneeAngle.optimal.min = parseInt(newKneeMin);
    if (newKneeMax) BASELINE_DATA.kneeAngle.optimal.max = parseInt(newKneeMax);
    if (newTorsoMin) BASELINE_DATA.torsoLean.optimal.min = parseInt(newTorsoMin);
    if (newTorsoMax) BASELINE_DATA.torsoLean.optimal.max = parseInt(newTorsoMax);
    
    console.log('Updated baseline:', BASELINE_DATA);
    alert('Baseline updated! Re-run analysis to see changes.');
}

function toggleDevPanel() {
    if (window.devPanel) {
        window.devPanel.remove();
        window.devPanel = null;
    }
}

// Auto-enable demo mode if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    enableDemoMode();
    console.log('🏠 Development environment detected - Demo mode enabled');
}

// URL parameter controls
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('demo') === 'true') {
    enableDemoMode();
}
if (urlParams.get('coach') === 'true') {
    enableCoachingMode();
}
if (urlParams.get('dev') === 'true') {
    enableDeveloperMode();
}

console.log('✅ Demo configuration loaded!'); 