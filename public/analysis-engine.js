// RunForm.AI - Consolidated Analysis Engine
// Centralizes all analysis logic from app.js, workers, and phase2-features

console.log('🔬 Loading Analysis Engine...');

// Global analysis state
const AnalysisEngine = {
    // State management
    state: {
        isAnalyzing: false,
        analysisData: [],
        currentVideo: null,
        charts: {
            kneeAngle: null,
            torsoAngle: null
        }
    },

    // Configuration
    config: {
        frameRate: 10,
        thresholds: {
            kneeAngle: { optimal: { min: 85, max: 125 }, elite: { min: 90, max: 120 } },
            torsoLean: { optimal: { min: 5, max: 15 }, elite: { min: 8, max: 12 } }
        },
        coaching: {
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
        }
    },

    // Core analysis function (unified from all sources)
    analyzeFrame(landmarks, frameIndex = null) {
        if (!landmarks || landmarks.length < 33) return null;

        const analysis = {
            timestamp: Date.now(),
            frameIndex: frameIndex || this.state.analysisData.length,
            issues: [],
            metrics: {},
            quality: 'good',
            angles: {},
            keyPoints: {}
        };

        try {
            // Get key landmarks with validation
            const keyLandmarks = this.extractKeyLandmarks(landmarks);
            if (!keyLandmarks.isValid) {
                analysis.quality = 'poor';
                return analysis;
            }

            // Calculate angles and metrics
            const angles = this.calculateAngles(keyLandmarks);
            const metrics = this.calculateMetrics(keyLandmarks, angles);
            
            analysis.angles = angles;
            analysis.metrics = metrics;
            analysis.keyPoints = this.extractKeyPoints(keyLandmarks, angles);

            // Detect issues based on thresholds
            analysis.issues = this.detectIssues(angles, metrics);

            // Assess quality
            analysis.quality = this.assessQuality(analysis.issues, keyLandmarks.visibility);

        } catch (error) {
            console.error('Error in frame analysis:', error);
            analysis.quality = 'poor';
        }

        return analysis;
    },

    // Extract and validate key landmarks
    extractKeyLandmarks(landmarks) {
        const required = {
            leftShoulder: landmarks[11],
            rightShoulder: landmarks[12],
            leftHip: landmarks[23],
            rightHip: landmarks[24],
            leftKnee: landmarks[25],
            rightKnee: landmarks[26],
            leftAnkle: landmarks[27],
            rightAnkle: landmarks[28]
        };

        // Check visibility
        const visibleCount = Object.values(required)
            .filter(landmark => landmark && landmark.visibility > 0.3).length;
        
        return {
            ...required,
            isValid: visibleCount >= 5,
            visibility: visibleCount / Object.keys(required).length
        };
    },

    // Calculate all angles
    calculateAngles(landmarks) {
        // Torso angle
        const shoulderMidpoint = {
            x: (landmarks.leftShoulder.x + landmarks.rightShoulder.x) / 2,
            y: (landmarks.leftShoulder.y + landmarks.rightShoulder.y) / 2
        };
        const hipMidpoint = {
            x: (landmarks.leftHip.x + landmarks.rightHip.x) / 2,
            y: (landmarks.leftHip.y + landmarks.rightHip.y) / 2
        };

        const torsoAngle = Math.atan2(
            shoulderMidpoint.x - hipMidpoint.x,
            hipMidpoint.y - shoulderMidpoint.y
        ) * (180 / Math.PI);

        // Knee angles
        const leftKneeAngle = this.calculateKneeAngle(
            landmarks.leftHip, landmarks.leftKnee, landmarks.leftAnkle
        );
        const rightKneeAngle = this.calculateKneeAngle(
            landmarks.rightHip, landmarks.rightKnee, landmarks.rightAnkle
        );

        return {
            torsoLean: Math.abs(torsoAngle),
            leftKnee: leftKneeAngle,
            rightKnee: rightKneeAngle
        };
    },

    // Calculate knee angle between three points
    calculateKneeAngle(hip, knee, ankle) {
        if (!hip || !knee || !ankle) return 0;
        
        const hipToKnee = { x: knee.x - hip.x, y: knee.y - hip.y };
        const kneeToAnkle = { x: ankle.x - knee.x, y: ankle.y - knee.y };
        
        const dot = hipToKnee.x * kneeToAnkle.x + hipToKnee.y * kneeToAnkle.y;
        const magHipKnee = Math.sqrt(hipToKnee.x ** 2 + hipToKnee.y ** 2);
        const magKneeAnkle = Math.sqrt(kneeToAnkle.x ** 2 + kneeToAnkle.y ** 2);
        
        if (magHipKnee === 0 || magKneeAnkle === 0) return 0;
        
        const cos = dot / (magHipKnee * magKneeAnkle);
        const angle = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);
        
        return 180 - angle;
    },

    // Calculate metrics
    calculateMetrics(landmarks, angles) {
        const kneeHeight = Math.max(
            landmarks.leftHip.y - landmarks.leftKnee.y,
            landmarks.rightHip.y - landmarks.rightKnee.y
        );

        const strideWidth = landmarks.leftAnkle && landmarks.rightAnkle 
            ? Math.abs(landmarks.leftAnkle.x - landmarks.rightAnkle.x)
            : 0;

        return {
            torsoLean: angles.torsoLean,
            kneeHeight,
            strideWidth
        };
    },

    // Extract key points for visualizations
    extractKeyPoints(landmarks, angles) {
        return {
            leftKnee: {
                x: landmarks.leftKnee.x,
                y: landmarks.leftKnee.y,
                angle: angles.leftKnee
            },
            rightKnee: {
                x: landmarks.rightKnee.x,
                y: landmarks.rightKnee.y,
                angle: angles.rightKnee
            },
            torso: { angle: angles.torsoLean },
            visibility: landmarks.visibility
        };
    },

    // Detect form issues
    detectIssues(angles, metrics) {
        const issues = [];
        const { thresholds } = this.config;

        // Forward lean check
        if (angles.torsoLean > thresholds.torsoLean.optimal.max) {
            issues.push({
                type: 'excessive_forward_lean',
                severity: angles.torsoLean > 25 ? 'high' : 'medium',
                angle: angles.torsoLean,
                baseline: thresholds.torsoLean.optimal.max
            });
        }

        // Knee drive check
        if (metrics.kneeHeight < 0.15) {
            issues.push({
                type: 'low_knee_drive',
                severity: metrics.kneeHeight < 0.1 ? 'high' : 'medium',
                height: metrics.kneeHeight
            });
        }

        // Stride check
        if (metrics.strideWidth > 0.3) {
            issues.push({
                type: 'overstriding',
                severity: metrics.strideWidth > 0.4 ? 'high' : 'medium',
                width: metrics.strideWidth
            });
        }

        return issues;
    },

    // Assess overall frame quality
    assessQuality(issues, visibility) {
        if (visibility < 0.6) return 'poor';
        if (issues.length === 0) return 'excellent';
        if (issues.length <= 2) return 'good';
        return 'needs_improvement';
    },

    // Generate summary metrics
    generateSummaryMetrics() {
        const data = this.state.analysisData;
        if (!data || data.length === 0) return null;

        const totalFrames = data.length;
        const totalIssues = data.reduce((sum, frame) => sum + (frame.issues?.length || 0), 0);
        const qualityFrames = data.filter(frame => 
            frame.quality === 'excellent' || frame.quality === 'good'
        ).length;
        
        const avgTorsoLean = data.reduce((sum, frame) => 
            sum + (frame.metrics?.torsoLean || 0), 0) / totalFrames;
        
        return {
            totalFrames,
            totalIssues,
            qualityPercentage: (qualityFrames / totalFrames) * 100,
            avgTorsoLean
        };
    },

    // Generate coaching insights
    generateCoachingInsights() {
        const data = this.state.analysisData;
        if (!data || data.length === 0) return [];

        const issueStats = {};
        data.forEach(frame => {
            if (frame.issues) {
                frame.issues.forEach(issue => {
                    if (!issueStats[issue.type]) {
                        issueStats[issue.type] = { count: 0, severities: { high: 0, medium: 0, low: 0 } };
                    }
                    issueStats[issue.type].count++;
                    issueStats[issue.type].severities[issue.severity || 'medium']++;
                });
            }
        });

        const insights = [];
        const totalFrames = data.length;

        // Overall assessment
        const totalIssues = Object.values(issueStats).reduce((sum, stat) => sum + stat.count, 0);
        const issueRate = (totalIssues / totalFrames) * 100;

        let overallAssessment = '';
        if (issueRate < 10) {
            overallAssessment = `Excellent! Your running form is very consistent with only ${issueRate.toFixed(1)}% of frames showing areas for improvement.`;
        } else if (issueRate < 30) {
            overallAssessment = `Good foundation! Your form is solid but there are opportunities to optimize in ${issueRate.toFixed(1)}% of your stride.`;
        } else {
            overallAssessment = `Great potential! We've identified specific areas to focus on that will significantly improve your efficiency and reduce injury risk.`;
        }

        insights.push({
            title: '🎯 Overall Assessment',
            insight: overallAssessment,
            recommendations: [
                'Continue consistent training',
                'Focus on the specific drills below',
                'Practice good form at slower speeds first',
                'Gradually increase pace while maintaining form'
            ]
        });

        // Issue-specific insights
        Object.entries(issueStats).forEach(([issueType, stats]) => {
            const percentage = (stats.count / totalFrames) * 100;
            const drills = this.config.coaching[issueType] || [];
            
            let title, insight;
            switch (issueType) {
                case 'low_knee_drive':
                    title = '🦵 Knee Drive Optimization';
                    insight = `Your knee drive needs attention in ${stats.count} frames (${percentage.toFixed(1)}% of your run). Higher knee lift will improve your running efficiency and speed.`;
                    break;
                case 'excessive_forward_lean':
                    title = '🏃‍♂️ Posture Correction';
                    insight = `Forward lean detected in ${stats.count} frames (${percentage.toFixed(1)}% of your run). Better posture will reduce back strain and improve breathing.`;
                    break;
                case 'overstriding':
                    title = '👟 Stride Efficiency';
                    insight = `Overstriding occurred in ${stats.count} frames (${percentage.toFixed(1)}% of your run). Shorter, quicker steps will reduce impact and improve speed.`;
                    break;
                default:
                    title = '⚡ Form Improvement';
                    insight = `This area needs attention in ${percentage.toFixed(1)}% of your running stride.`;
            }

            insights.push({ title, insight, recommendations: drills });
        });

        return insights;
    },

    // Reset analysis state
    reset() {
        this.state.analysisData = [];
        this.state.isAnalyzing = false;
        this.state.currentVideo = null;
        
        // Destroy charts
        if (this.state.charts.kneeAngle) {
            this.state.charts.kneeAngle.destroy();
            this.state.charts.kneeAngle = null;
        }
        if (this.state.charts.torsoAngle) {
            this.state.charts.torsoAngle.destroy();
            this.state.charts.torsoAngle = null;
        }
    }
};

// Make available globally
window.AnalysisEngine = AnalysisEngine;

console.log('✅ Analysis Engine loaded successfully!'); 