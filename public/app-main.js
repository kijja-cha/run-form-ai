// Main App Logic and Event Listeners
console.log('🚀 Starting RunForm.AI Main Application...');

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
        analyzeBtn.addEventListener('click', analyzeVideo);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetApp);
    }

    // Export controls
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', exportToPDF);
    }

    if (exportImageBtn) {
        exportImageBtn.addEventListener('click', exportToImage);
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', generateShareLink);
    }
}

// Webcam functionality
async function startWebcam() {
    try {
        console.log('📹 Starting webcam...');
        
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

        // Initialize camera for MediaPipe
        if (pose) {
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

    } catch (error) {
        console.error('❌ Webcam access failed:', error);
        alert('Could not access camera. Please check permissions and try again.');
    }
}

// Video upload functionality
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    console.log('📁 Processing uploaded video...');

    if (inputVideoElement) {
        const url = URL.createObjectURL(file);
        inputVideoElement.src = url;
        inputVideoElement.load();

        inputVideoElement.addEventListener('loadedmetadata', () => {
            currentVideo = inputVideoElement;
            updateVideoInfo(inputVideoElement);
            
            if (videoPreviewSection) videoPreviewSection.style.display = 'block';
            if (analyzeBtn) analyzeBtn.disabled = false;
            
            showSection(step2);
            updateStatusIndicator(true, 'Video Loaded', 'complete');
        });

        inputVideoElement.addEventListener('error', () => {
            alert('Error loading video. Please try a different file.');
        });
    }
}

// Recording functionality
function startRecording() {
    if (!webcamElement || !webcamElement.srcObject) return;

    try {
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
                    if (analyzeBtn) analyzeBtn.disabled = false;
                    
                    updateStatusIndicator(true, 'Recording Complete', 'complete');
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

// Main analysis function
async function analyzeVideo() {
    if (!currentVideo || !pose) {
        alert('Please load a video first.');
        return;
    }

    console.log('🔍 Starting enhanced analysis...');
    
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
    const frameRate = 10; // Process 10 frames per second
    const totalFrames = Math.floor(duration * frameRate);

    // Set up canvas for processing
    outputCanvas.width = video.videoWidth || 640;
    outputCanvas.height = video.videoHeight || 480;

    try {
        for (let i = 0; i < totalFrames; i++) {
            const currentTime = (i / frameRate);
            video.currentTime = currentTime;

            await new Promise((resolve) => {
                video.addEventListener('seeked', resolve, { once: true });
            });

            // Process frame with MediaPipe
            await pose.send({ image: video });

            // Update progress
            const progress = ((i + 1) / totalFrames) * 100;
            const currentInsights = analysisData.reduce((sum, frame) => sum + frame.issues.length, 0);
            
            updateProgressOverlay(
                true,
                `Analyzing frame ${i + 1} of ${totalFrames}...`,
                progress,
                i + 1,
                currentInsights,
                progress > 50 ? 'High Quality' : 'Building...'
            );

            // Add small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Generate comprehensive results
        console.log('📊 Generating comprehensive analysis...');
        
        updateProgressOverlay(true, 'Generating insights and recommendations...', 100, totalFrames, 
                            analysisData.reduce((sum, frame) => sum + frame.issues.length, 0), 'Complete');

        // Generate all Phase 2 features
        await generateAllResults();

        // Hide progress and show results
        setTimeout(() => {
            updateProgressOverlay(false);
            updateStatusIndicator(true, 'Analysis Complete', 'complete');
        }, 1000);

    } catch (error) {
        console.error('❌ Analysis failed:', error);
        updateProgressOverlay(false);
        updateStatusIndicator(true, 'Analysis Failed', 'error');
        alert('Analysis failed. Please try again.');
    } finally {
        isAnalyzing = false;
    }
}

// Generate all Phase 2 results
async function generateAllResults() {
    // 1. Generate basic metrics overview
    generateMetricsOverview();
    
    // 2. Create interactive charts
    createInteractiveCharts();
    
    // 3. Generate frame snapshots
    generateFrameSnapshots();
    
    // 4. Create coaching insights
    generateCoachingInsights();
    
    // 5. Generate data quality report
    generateDataQualityReport();
    
    // 6. Generate traditional feedback
    generateDetailedFeedback();
}

function generateMetricsOverview() {
    if (!analysisData || analysisData.length === 0) return;

    const totalFrames = analysisData.length;
    const totalIssues = analysisData.reduce((sum, frame) => sum + frame.issues.length, 0);
    const goodQualityFrames = analysisData.filter(frame => frame.quality === 'excellent' || frame.quality === 'good').length;
    const avgKneeAngle = analysisData.reduce((sum, frame) => sum + Math.max(frame.angles?.leftKnee || 0, frame.angles?.rightKnee || 0), 0) / totalFrames;
    const avgTorsoLean = analysisData.reduce((sum, frame) => sum + (frame.angles?.torsoLean || 0), 0) / totalFrames;

    if (metricsOverview) {
        metricsOverview.innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-value">${totalFrames}</div>
                    <div class="metric-label">Frames Analyzed</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${totalIssues}</div>
                    <div class="metric-label">Insights Generated</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${((goodQualityFrames / totalFrames) * 100).toFixed(0)}%</div>
                    <div class="metric-label">Data Quality</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${avgKneeAngle.toFixed(0)}°</div>
                    <div class="metric-label">Avg Knee Angle</div>
                </div>
                <div class="metric-card">
                    <div class="metric-value">${avgTorsoLean.toFixed(1)}°</div>
                    <div class="metric-label">Avg Torso Lean</div>
                </div>
            </div>
        `;
    }
}

function generateDetailedFeedback() {
    // This function generates the traditional feedback cards for backward compatibility
    if (!analysisData || analysisData.length === 0) {
        document.getElementById('feedbackContent').innerHTML = '<p>No analysis data available.</p>';
        return;
    }

    const totalFrames = analysisData.length;
    const issueTypes = {};
    
    analysisData.forEach(frame => {
        frame.issues.forEach(issue => {
            if (!issueTypes[issue.type]) issueTypes[issue.type] = [];
            issueTypes[issue.type].push(issue);
        });
    });

    const feedbackItems = [];

    // Overall summary
    const totalIssues = Object.values(issueTypes).reduce((sum, issues) => sum + issues.length, 0);
    feedbackItems.push({
        type: totalIssues === 0 ? 'good' : totalIssues < 10 ? 'info' : 'warning',
        title: '📊 Analysis Summary',
        content: `Analyzed ${totalFrames} frames and detected ${totalIssues} areas for improvement. ${totalIssues === 0 ? 'Excellent form consistency!' : 'Focus on the recommendations below for optimization.'}`
    });

    // Issue-specific feedback
    Object.entries(issueTypes).forEach(([type, issues]) => {
        const percentage = (issues.length / totalFrames) * 100;
        let title, content, feedbackType;

        switch (type) {
            case 'low_knee_drive':
                title = '🦵 Knee Drive Analysis';
                content = `Low knee drive detected in ${issues.length} frames (${percentage.toFixed(1)}%). Focus on high knees drills and maintaining proper knee lift throughout your stride.`;
                feedbackType = percentage > 20 ? 'warning' : 'info';
                break;
            case 'excessive_forward_lean':
                title = '🏃‍♂️ Posture Analysis';
                content = `Forward lean issues in ${issues.length} frames (${percentage.toFixed(1)}%). Work on running tall with upright posture to improve efficiency and reduce back strain.`;
                feedbackType = percentage > 30 ? 'error' : 'warning';
                break;
            case 'overstriding':
                title = '👟 Stride Analysis';
                content = `Overstriding detected in ${issues.length} frames (${percentage.toFixed(1)}%). Focus on quicker cadence and landing with feet closer to your center of gravity.`;
                feedbackType = percentage > 25 ? 'warning' : 'info';
                break;
            default:
                title = '⚡ Form Analysis';
                content = `${type} detected in ${issues.length} frames (${percentage.toFixed(1)}%).`;
                feedbackType = 'info';
        }

        feedbackItems.push({ type: feedbackType, title, content });
    });

    // Render feedback
    const feedbackHTML = feedbackItems.map(item => `
        <div class="feedback-item ${item.type}">
            <h4>${item.title}</h4>
            <p>${item.content}</p>
        </div>
    `).join('');

    if (document.getElementById('feedbackContent')) {
        document.getElementById('feedbackContent').innerHTML = feedbackHTML;
    }
}

// Reset application
function resetApp() {
    console.log('🔄 Resetting application...');
    
    // Stop camera and recording
    if (camera) camera.stop();
    if (mediaRecorder && isRecording) stopRecording();
    
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
}

// Initialize application
async function initializeApp() {
    console.log('🏃‍♂️ Initializing RunForm.AI Phase 2...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize MediaPipe Pose
    await initializePose();
    
    // Show initial section
    showSection(step1);
    
    console.log('✅ RunForm.AI Phase 2 initialized successfully!');
}

// Start the application when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

console.log('🎉 RunForm.AI Phase 2 - AI Personal Running Form Coach loaded!'); 