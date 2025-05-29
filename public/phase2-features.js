// RunForm.AI Phase 2 Features
console.log('📊 Loading Phase 2 Features...');

// Generate metrics overview
function generateMetricsOverview() {
    if (!analysisData || analysisData.length === 0 || !metricsOverview) return;
    
    console.log('📊 Generating metrics overview...');
    
    // Calculate summary metrics
    const totalFrames = analysisData.length;
    const totalIssues = analysisData.reduce((sum, frame) => sum + (frame.issues?.length || 0), 0);
    const qualityFrames = analysisData.filter(frame => frame.quality === 'excellent' || frame.quality === 'good').length;
    const qualityPercentage = (qualityFrames / totalFrames) * 100;
    
    // Average metrics
    const avgTorsoLean = analysisData.reduce((sum, frame) => sum + (frame.metrics?.torsoLean || 0), 0) / totalFrames;
    const avgKneeHeight = analysisData.reduce((sum, frame) => sum + (frame.metrics?.kneeHeight || 0), 0) / totalFrames;
    
    const metricsHTML = `
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
                <div class="metric-value">${qualityPercentage.toFixed(0)}%</div>
                <div class="metric-label">Quality Score</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${avgTorsoLean.toFixed(1)}°</div>
                <div class="metric-label">Avg Torso Lean</div>
            </div>
        </div>
    `;
    
    metricsOverview.innerHTML = metricsHTML;
}

// Generate detailed feedback
function generateDetailedFeedback() {
    const feedbackContent = document.getElementById('feedbackContent');
    if (!feedbackContent || !analysisData || analysisData.length === 0) return;
    
    console.log('📝 Generating detailed feedback...');
    
    // Aggregate issues by type
    const issueStats = {};
    analysisData.forEach(frame => {
        if (frame.issues) {
            frame.issues.forEach(issue => {
                if (!issueStats[issue.type]) {
                    issueStats[issue.type] = {
                        count: 0,
                        severities: { high: 0, medium: 0, low: 0 }
                    };
                }
                issueStats[issue.type].count++;
                issueStats[issue.type].severities[issue.severity || 'medium']++;
            });
        }
    });
    
    let feedbackHTML = '';
    
    // Generate feedback for each issue type
    Object.entries(issueStats).forEach(([issueType, stats]) => {
        const percentage = (stats.count / analysisData.length) * 100;
        let severity = 'info';
        let icon = 'ℹ️';
        let title = '';
        let description = '';
        
        switch (issueType) {
            case 'excessive_forward_lean':
                severity = stats.severities.high > 0 ? 'error' : 'warning';
                icon = '📐';
                title = 'Forward Lean Analysis';
                description = `Excessive forward lean detected in ${percentage.toFixed(1)}% of frames. This can lead to inefficient running and potential injury.`;
                break;
            case 'low_knee_drive':
                severity = stats.severities.high > 0 ? 'error' : 'warning';
                icon = '🦵';
                title = 'Knee Drive Assessment';
                description = `Low knee drive observed in ${percentage.toFixed(1)}% of frames. Improve knee lift for better running efficiency.`;
                break;
            case 'overstriding':
                severity = stats.severities.high > 0 ? 'error' : 'warning';
                icon = '👟';
                title = 'Stride Analysis';
                description = `Overstriding detected in ${percentage.toFixed(1)}% of frames. Focus on shorter, quicker steps for better form.`;
                break;
            default:
                title = issueType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                description = `Issue detected in ${percentage.toFixed(1)}% of frames.`;
        }
        
        feedbackHTML += `
            <div class="feedback-item ${severity}">
                <h4>${icon} ${title}</h4>
                <p>${description}</p>
                <p><strong>Frequency:</strong> ${stats.count} occurrences (${percentage.toFixed(1)}% of analysis)</p>
            </div>
        `;
    });
    
    // Add overall summary if no issues
    if (Object.keys(issueStats).length === 0) {
        feedbackHTML = `
            <div class="feedback-item good">
                <h4>✅ Excellent Running Form</h4>
                <p>Your running form analysis shows no major issues detected. Keep up the great technique!</p>
                <p><strong>Quality:</strong> High consistency throughout the analysis period.</p>
            </div>
        `;
    }
    
    feedbackContent.innerHTML = feedbackHTML;
}

// Chart creation and management
function createInteractiveCharts() {
    if (!analysisData || analysisData.length === 0) return;

    // Prepare data for charts
    const frameNumbers = analysisData.map((_, index) => index + 1);
    const kneeAngles = analysisData.map(frame => Math.max(frame.angles?.leftKnee || 0, frame.angles?.rightKnee || 0));
    const torsoAngles = analysisData.map(frame => frame.angles?.torsoLean || 0);

    // Destroy existing charts
    if (kneeAngleChart) {
        kneeAngleChart.destroy();
    }
    if (torsoAngleChart) {
        torsoAngleChart.destroy();
    }

    // Create Knee Angle Chart
    const kneeCtx = document.getElementById('kneeAngleChart');
    if (kneeCtx) {
        kneeAngleChart = new Chart(kneeCtx, {
            type: 'line',
            data: {
                labels: frameNumbers,
                datasets: [{
                    label: 'Knee Angle',
                    data: kneeAngles,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }, {
                    label: 'Optimal Range (Min)',
                    data: Array(frameNumbers.length).fill(BASELINE_DATA.kneeAngle.optimal.min),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0
                }, {
                    label: 'Optimal Range (Max)',
                    data: Array(frameNumbers.length).fill(BASELINE_DATA.kneeAngle.optimal.max),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🦵 Knee Angle Analysis',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `Frame ${context[0].label}`;
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Knee Angle: ${context.parsed.y.toFixed(1)}°`;
                                }
                                return context.dataset.label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Frame Number'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Angle (degrees)'
                        },
                        min: 60,
                        max: 180
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    // Create Torso Angle Chart
    const torsoCtx = document.getElementById('torsoAngleChart');
    if (torsoCtx) {
        torsoAngleChart = new Chart(torsoCtx, {
            type: 'line',
            data: {
                labels: frameNumbers,
                datasets: [{
                    label: 'Torso Lean',
                    data: torsoAngles,
                    borderColor: '#f093fb',
                    backgroundColor: 'rgba(240, 147, 251, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#f093fb',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }, {
                    label: 'Optimal Range (Min)',
                    data: Array(frameNumbers.length).fill(BASELINE_DATA.torsoLean.optimal.min),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0
                }, {
                    label: 'Optimal Range (Max)',
                    data: Array(frameNumbers.length).fill(BASELINE_DATA.torsoLean.optimal.max),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    borderWidth: 2,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🏃‍♂️ Torso Lean Analysis',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            title: function(context) {
                                return `Frame ${context[0].label}`;
                            },
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Torso Lean: ${context.parsed.y.toFixed(1)}°`;
                                }
                                return context.dataset.label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Frame Number'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Lean Angle (degrees)'
                        },
                        min: 0,
                        max: 40
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }
}

// Generate frame snapshots for best/worst moments
function generateFrameSnapshots() {
    if (!analysisData || analysisData.length === 0 || !currentVideo) return;

    // Find best and worst frames
    const kneeAngles = analysisData.map(frame => Math.max(frame.angles?.leftKnee || 0, frame.angles?.rightKnee || 0));
    const torsoAngles = analysisData.map(frame => frame.angles?.torsoLean || 0);

    const bestKneeFrame = kneeAngles.indexOf(Math.max(...kneeAngles));
    const worstKneeFrame = kneeAngles.indexOf(Math.min(...kneeAngles));
    const bestTorsoFrame = torsoAngles.indexOf(Math.min(...torsoAngles));
    const worstTorsoFrame = torsoAngles.indexOf(Math.max(...torsoAngles));

    const snapshots = [
        {
            type: 'best',
            title: '🌟 Best Knee Drive',
            frameIndex: bestKneeFrame,
            description: `Excellent knee lift at ${kneeAngles[bestKneeFrame].toFixed(1)}° - this is your target form!`,
            metrics: `Frame ${bestKneeFrame + 1} • Knee: ${kneeAngles[bestKneeFrame].toFixed(1)}°`,
            icon: '🏆'
        },
        {
            type: 'worst',
            title: '⚠️ Low Knee Drive',
            frameIndex: worstKneeFrame,
            description: `Knee drive could be improved here. Try to lift your knee higher during this phase.`,
            metrics: `Frame ${worstKneeFrame + 1} • Knee: ${kneeAngles[worstKneeFrame].toFixed(1)}°`,
            icon: '📈'
        },
        {
            type: 'best',
            title: '✨ Good Posture',
            frameIndex: bestTorsoFrame,
            description: `Great upright posture with ${torsoAngles[bestTorsoFrame].toFixed(1)}° lean - maintain this form!`,
            metrics: `Frame ${bestTorsoFrame + 1} • Lean: ${torsoAngles[bestTorsoFrame].toFixed(1)}°`,
            icon: '👑'
        },
        {
            type: 'worst',
            title: '🔧 Forward Lean',
            frameIndex: worstTorsoFrame,
            description: `Too much forward lean here. Focus on running tall with upright posture.`,
            metrics: `Frame ${worstTorsoFrame + 1} • Lean: ${torsoAngles[worstTorsoFrame].toFixed(1)}°`,
            icon: '⚡'
        }
    ];

    // Generate snapshot images
    snapshots.forEach(snapshot => {
        generateSnapshotImage(snapshot);
    });
}

function generateSnapshotImage(snapshot) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 200;

    // Set video time to frame
    const frameTime = (snapshot.frameIndex / analysisData.length) * currentVideo.duration;
    currentVideo.currentTime = frameTime;

    currentVideo.addEventListener('seeked', function onSeeked() {
        currentVideo.removeEventListener('seeked', onSeeked);
        
        // Draw video frame
        ctx.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
        
        // Add overlay
        ctx.fillStyle = snapshot.type === 'best' ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.fillRect(0, 0, canvas.width, 30);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(snapshot.title, 10, 20);

        // Create snapshot card
        const snapshotCard = document.createElement('div');
        snapshotCard.className = 'snapshot-card';
        snapshotCard.innerHTML = `
            <img src="${canvas.toDataURL()}" alt="${snapshot.title}" class="snapshot-image">
            <div class="snapshot-info">
                <div class="snapshot-title">
                    <span>${snapshot.icon}</span>
                    ${snapshot.title}
                </div>
                <div class="snapshot-description">${snapshot.description}</div>
                <div class="snapshot-metrics">${snapshot.metrics}</div>
            </div>
        `;

        if (snapshotsGrid) {
            snapshotsGrid.appendChild(snapshotCard);
        }
    });
}

// Generate personalized coaching insights
function generateCoachingInsights() {
    if (!analysisData || analysisData.length === 0) return;

    const totalFrames = analysisData.length;
    const issueTypes = {};
    const severityCounts = { low: 0, medium: 0, high: 0 };
    
    // Analyze all issues
    analysisData.forEach(frame => {
        frame.issues.forEach(issue => {
            if (!issueTypes[issue.type]) issueTypes[issue.type] = 0;
            issueTypes[issue.type]++;
            severityCounts[issue.severity]++;
        });
    });

    const coachingCards = [];

    // Overall assessment
    const totalIssues = Object.values(issueTypes).reduce((sum, count) => sum + count, 0);
    const issueRate = (totalIssues / totalFrames) * 100;

    let overallAssessment = '';
    let overallIcon = '';
    if (issueRate < 10) {
        overallAssessment = `Excellent! Your running form is very consistent with only ${issueRate.toFixed(1)}% of frames showing areas for improvement.`;
        overallIcon = '🌟';
    } else if (issueRate < 30) {
        overallAssessment = `Good foundation! Your form is solid but there are opportunities to optimize in ${issueRate.toFixed(1)}% of your stride.`;
        overallIcon = '👍';
    } else {
        overallAssessment = `Great potential! We've identified specific areas to focus on that will significantly improve your efficiency and reduce injury risk.`;
        overallIcon = '🎯';
    }

    coachingCards.push({
        title: `${overallIcon} Overall Assessment`,
        insight: overallAssessment,
        recommendations: [
            'Continue consistent training',
            'Focus on the specific drills below',
            'Practice good form at slower speeds first',
            'Gradually increase pace while maintaining form'
        ]
    });

    // Issue-specific coaching
    Object.entries(issueTypes).forEach(([issueType, count]) => {
        const percentage = (count / totalFrames) * 100;
        const drills = COACHING_DRILLS[issueType] || [];
        
        let title, insight, icon;
        
        switch (issueType) {
            case 'low_knee_drive':
                icon = '🦵';
                title = 'Knee Drive Optimization';
                insight = `Your knee drive needs attention in ${count} frames (${percentage.toFixed(1)}% of your run). Higher knee lift will improve your running efficiency and speed.`;
                break;
            case 'excessive_forward_lean':
                icon = '🏃‍♂️';
                title = 'Posture Correction';
                insight = `Forward lean detected in ${count} frames (${percentage.toFixed(1)}% of your run). Better posture will reduce back strain and improve breathing.`;
                break;
            case 'overstriding':
                icon = '👟';
                title = 'Stride Efficiency';
                insight = `Overstriding occurred in ${count} frames (${percentage.toFixed(1)}% of your run). Shorter, quicker steps will reduce impact and improve speed.`;
                break;
            default:
                icon = '⚡';
                title = 'Form Improvement';
                insight = `This area needs attention in ${percentage.toFixed(1)}% of your running stride.`;
        }

        coachingCards.push({
            title: `${icon} ${title}`,
            insight,
            recommendations: drills
        });
    });

    // Render coaching cards
    if (coachingContent) {
        coachingContent.innerHTML = coachingCards.map(card => `
            <div class="coaching-card">
                <div class="coaching-title">${card.title}</div>
                <div class="coaching-insight">${card.insight}</div>
                <div class="coaching-recommendations">
                    <h5>💡 Recommended Drills:</h5>
                    <ul class="drill-list">
                        ${card.recommendations.map(drill => `<li class="drill-item">${drill}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('');
    }
}

// Generate data quality report
function generateDataQualityReport() {
    if (!analysisData || analysisData.length === 0) return;

    const totalFrames = analysisData.length;
    const goodQualityFrames = analysisData.filter(frame => frame.quality === 'excellent' || frame.quality === 'good').length;
    const averageVisibility = analysisData.reduce((sum, frame) => sum + (frame.keyPoints?.visibility || 0), 0) / totalFrames;
    
    const qualityPercentage = (goodQualityFrames / totalFrames) * 100;
    const visibilityPercentage = averageVisibility * 100;

    let overallQuality = 'Excellent';
    if (qualityPercentage < 60) overallQuality = 'Poor';
    else if (qualityPercentage < 80) overallQuality = 'Good';
    else if (qualityPercentage < 95) overallQuality = 'Very Good';

    const recommendations = [];
    if (visibilityPercentage < 80) {
        recommendations.push('Improve lighting conditions');
        recommendations.push('Ensure full body is visible in frame');
        recommendations.push('Use contrasting clothing colors');
    }
    if (qualityPercentage < 90) {
        recommendations.push('Record from a side angle for best analysis');
        recommendations.push('Keep camera steady during recording');
        recommendations.push('Maintain consistent distance from camera');
    }
    if (totalFrames < 100) {
        recommendations.push('Record longer videos (8-15 seconds) for better analysis');
    }

    if (dataQualityContent) {
        dataQualityContent.innerHTML = `
            <div class="quality-metrics">
                <div class="quality-metric">
                    <div class="quality-value">${overallQuality}</div>
                    <div class="quality-label">Overall Quality</div>
                </div>
                <div class="quality-metric">
                    <div class="quality-value">${qualityPercentage.toFixed(1)}%</div>
                    <div class="quality-label">Good Frames</div>
                </div>
                <div class="quality-metric">
                    <div class="quality-value">${visibilityPercentage.toFixed(1)}%</div>
                    <div class="quality-label">Pose Visibility</div>
                </div>
                <div class="quality-metric">
                    <div class="quality-value">${totalFrames}</div>
                    <div class="quality-label">Total Frames</div>
                </div>
            </div>
            ${recommendations.length > 0 ? `
                <div class="quality-recommendations">
                    <h5>📋 Recommendations for Better Analysis:</h5>
                    <ul>
                        ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        `;
    }
}

// Export functionality
async function exportToPDF() {
    if (!window.jsPDF) {
        alert('PDF export is not available. Please check your internet connection.');
        return;
    }

    try {
        const { jsPDF } = window.jsPDF;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Add title
        pdf.setFontSize(20);
        pdf.text('RunForm.AI - Analysis Report', 20, 20);
        
        // Add summary
        pdf.setFontSize(12);
        const totalFrames = analysisData.length;
        const totalIssues = analysisData.reduce((sum, frame) => sum + frame.issues.length, 0);
        
        pdf.text(`Analysis Date: ${new Date().toLocaleDateString()}`, 20, 35);
        pdf.text(`Total Frames Analyzed: ${totalFrames}`, 20, 45);
        pdf.text(`Issues Detected: ${totalIssues}`, 20, 55);
        
        // Add charts (if html2canvas is available)
        if (window.html2canvas && chartsSection) {
            try {
                const canvas = await html2canvas(chartsSection, { scale: 0.5 });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 20, 70, 170, 100);
            } catch (error) {
                console.warn('Could not add charts to PDF:', error);
            }
        }
        
        // Save PDF
        pdf.save(`runform-analysis-${new Date().toISOString().split('T')[0]}.pdf`);
        
    } catch (error) {
        console.error('PDF export failed:', error);
        alert('Failed to export PDF. Please try again.');
    }
}

async function exportToImage() {
    if (!window.html2canvas || !feedbackSection) {
        alert('Image export is not available. Please check your internet connection.');
        return;
    }

    try {
        const canvas = await html2canvas(feedbackSection, {
            scale: 1,
            backgroundColor: '#ffffff'
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `runform-analysis-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
    } catch (error) {
        console.error('Image export failed:', error);
        alert('Failed to export image. Please try again.');
    }
}

function generateShareLink() {
    // Create a simplified share-friendly summary
    const totalFrames = analysisData.length;
    const totalIssues = analysisData.reduce((sum, frame) => sum + frame.issues.length, 0);
    const qualityFrames = analysisData.filter(frame => frame.quality === 'excellent' || frame.quality === 'good').length;
    const qualityPercentage = (qualityFrames / totalFrames) * 100;

    const shareData = {
        frames: totalFrames,
        issues: totalIssues,
        quality: qualityPercentage.toFixed(1),
        date: new Date().toISOString().split('T')[0]
    };

    // For demo purposes, create a simple share text
    const shareText = `🏃‍♂️ RunForm.AI Analysis Results:
📊 ${totalFrames} frames analyzed
⚡ ${totalIssues} areas for improvement identified
✨ ${qualityPercentage.toFixed(1)}% high-quality data
📅 ${new Date().toLocaleDateString()}

Analyze your running form at https://run-form-ai.vercel.app/`;

    if (navigator.share) {
        navigator.share({
            title: 'RunForm.AI Analysis Results',
            text: shareText,
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Analysis summary copied to clipboard!');
        }).catch(() => {
            // Final fallback: show in alert
            alert('Share your results:\n\n' + shareText);
        });
    }
}

console.log('✅ Phase 2 Features loaded successfully!'); 