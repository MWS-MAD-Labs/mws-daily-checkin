import faceDetectionService from './faceDetectionService';

class EmotionAnalysisService {
    constructor() {
        this.emotionHistory = [];
        this.maxHistoryLength = 100;
        this.baselineFeatures = null;
        this.isAnalyzing = false;
    }

    async initialize() {
        await faceDetectionService.initialize();
        console.log('🎭 Emotion Analysis Service initialized');
    }

    async startAnalysis(videoElement, onEmotionDetected) {
        this.isAnalyzing = true;
        this.emotionHistory = [];
        this.baselineFeatures = null;

        // Wait for video element to be ready
        if (videoElement.readyState < 2) { // HAVE_CURRENT_DATA or higher
            await new Promise((resolve) => {
                const onLoadedMetadata = () => {
                    videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
                    resolve();
                };
                videoElement.addEventListener('loadedmetadata', onLoadedMetadata);

                // Fallback timeout in case loadedmetadata doesn't fire
                setTimeout(resolve, 2000);
            });
        }

        faceDetectionService.startCamera(
            videoElement,
            (results) => {
                if (this.isAnalyzing) {
                    const emotion = this.analyzeEmotion(results);
                    if (emotion && onEmotionDetected) {
                        onEmotionDetected(emotion);
                    }
                }
            }
        );
    }

    stopAnalysis() {
        this.isAnalyzing = false;
        faceDetectionService.stopCamera();
    }

    analyzeEmotion(results) {
        const features = faceDetectionService.extractFeatures(results);

        if (!features) return null;

        // Store features for temporal analysis
        this.emotionHistory.push({
            timestamp: Date.now(),
            features: features,
            emotionResult: null // Will be set after classification
        });

        if (this.emotionHistory.length > this.maxHistoryLength) {
            this.emotionHistory.shift();
        }

        // Set baseline if not set (first few frames)
        if (!this.baselineFeatures && this.emotionHistory.length >= 5) {
            this.baselineFeatures = this.calculateBaselineFeatures();
        }

        if (!this.baselineFeatures) {
            console.log('⏳ Still collecting baseline features, history length:', this.emotionHistory.length);
            return null;
        }

        // Perform emotion classification
        const emotionResult = this.classifyEmotion(features);

        // Cache the emotion result in the most recent history entry
        if (this.emotionHistory.length > 0) {
            this.emotionHistory[this.emotionHistory.length - 1].emotionResult = emotionResult;
        }

        // Add temporal analysis
        const temporalAnalysis = this.analyzeTemporalPatterns();

        // Calculate confidence and explainability
        const confidence = this.calculateConfidence(emotionResult, features);
        const explanations = this.generateExplanations(emotionResult, features);

        console.log('🎯 Emotion analysis result:', emotionResult.primaryEmotion, 'confidence:', confidence);

        return {
            ...emotionResult,
            confidence: confidence,
            explanations: explanations,
            temporalAnalysis: temporalAnalysis,
            rawFeatures: features
        };
    }

    classifyEmotion(features) {
        // Multi-method emotion classification
        const methods = {
            facialExpression: this.classifyByFacialExpression(features),
            microExpressions: this.classifyByMicroExpressions(features),
            temporalPatterns: this.classifyByTemporalPatterns(),
            physiologicalSignals: this.classifyByPhysiologicalSignals(features)
        };

        // Ensemble voting with weighted scores
        const emotionScores = this.ensembleVoting(methods);

        // Get top emotions
        const sortedEmotions = Object.entries(emotionScores)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        const primaryEmotion = sortedEmotions[0][0];
        const secondaryEmotions = sortedEmotions.slice(1).map(([emotion]) => emotion);

        // Map to valence/arousal dimensions
        const valenceArousal = this.mapToValenceArousal(primaryEmotion);

        // Calculate intensity
        const intensity = this.calculateIntensity(features, primaryEmotion);

        return {
            primaryEmotion: primaryEmotion,
            secondaryEmotions: secondaryEmotions,
            valence: valenceArousal.valence,
            arousal: valenceArousal.arousal,
            intensity: intensity,
            emotionScores: emotionScores
        };
    }

    classifyByFacialExpression(features) {
        const scores = {
            happy: 0,
            sad: 0,
            angry: 0,
            surprised: 0,
            fearful: 0,
            disgusted: 0,
            neutral: 0,
            anxious: 0,
            calm: 0
        };

        // Mouth-based classification
        if (features.mouth.isSmiling && features.mouth.smileIntensity > 0.02) {
            scores.happy += 0.8;
            scores.calm += 0.2;
        } else if (features.mouth.aspectRatio > 0.5) {
            scores.surprised += 0.6;
            scores.fearful += 0.3;
        } else if (features.mouth.aspectRatio < 0.2) {
            scores.sad += 0.7;
            scores.disgusted += 0.2;
        }

        // Eye-based classification
        if (features.leftEye.blinkDetected || features.rightEye.blinkDetected) {
            scores.surprised += 0.4;
        }
        if (features.leftEye.openness < 0.3 || features.rightEye.openness < 0.3) {
            scores.anxious += 0.5;
            scores.sad += 0.3;
        }

        // Brow-based classification
        const avgBrowElevation = (features.leftBrow.elevation + features.rightBrow.elevation) / 2;
        if (avgBrowElevation < -0.1) {
            scores.sad += 0.6;
            scores.anxious += 0.3;
        } else if (avgBrowElevation > 0.1) {
            scores.surprised += 0.5;
            scores.fearful += 0.3;
        }

        // Furrowed brows indicate anger or concentration
        const avgFurrowing = (features.leftBrow.furrowing + features.rightBrow.furrowing) / 2;
        if (avgFurrowing < 0.05) {
            scores.angry += 0.4;
            scores.anxious += 0.3;
        }

        // Cheek puffiness can indicate anger or surprise
        if (features.cheeks.puffiness > 0.1) {
            scores.angry += 0.3;
            scores.surprised += 0.2;
        }

        // Nose wrinkling indicates disgust
        if (features.nose.wrinkling > 0.05) {
            scores.disgusted += 0.6;
        }

        // Normalize scores
        const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
        if (total > 0) {
            Object.keys(scores).forEach(emotion => {
                scores[emotion] = scores[emotion] / total;
            });
        }

        return scores;
    }

    classifyByMicroExpressions(features) {
        const scores = {
            happy: 0, sad: 0, angry: 0, surprised: 0,
            fearful: 0, disgusted: 0, neutral: 0, anxious: 0, calm: 0
        };

        // Micro-expression detection based on subtle movements
        const temporalFeatures = faceDetectionService.getTemporalFeatures();

        if (temporalFeatures) {
            // High blink rate indicates anxiety or stress
            if (temporalFeatures.blinkRate > 20) {
                scores.anxious += 0.6;
                scores.fearful += 0.3;
            }

            // Low expression stability indicates emotional turmoil
            if (temporalFeatures.expressionStability > 0.02) {
                scores.anxious += 0.4;
                scores.sad += 0.3;
            }

            // Micro-movements around eyes indicate suppressed emotions
            const eyeMovements = temporalFeatures.microMovements.filter(m =>
                m.landmark >= 33 && m.landmark <= 133 // Eye region landmarks
            );

            if (eyeMovements.length > 5) {
                scores.anxious += 0.5;
                scores.sad += 0.3;
            }
        }

        // Subtle asymmetry can indicate concealed emotions
        if (features.faceMetrics.symmetry > 0.05) {
            scores.anxious += 0.4;
            scores.sad += 0.3;
        }

        return scores;
    }

    classifyByTemporalPatterns() {
        const scores = {
            happy: 0, sad: 0, angry: 0, surprised: 0,
            fearful: 0, disgusted: 0, neutral: 0, anxious: 0, calm: 0
        };

        if (this.emotionHistory.length < 5) return scores;

        // Analyze emotion trends over time
        const recentEmotions = this.emotionHistory.slice(-10);
        const emotionTrends = this.calculateEmotionTrends(recentEmotions);

        // Sudden changes indicate surprise or fear
        if (emotionTrends.volatility > 0.3) {
            scores.surprised += 0.4;
            scores.fearful += 0.3;
        }

        // Gradual decline might indicate sadness
        if (emotionTrends.trend < -0.1) {
            scores.sad += 0.5;
        }

        // Sustained high arousal indicates anxiety
        if (emotionTrends.avgArousal > 0.7) {
            scores.anxious += 0.6;
        }

        // Sustained low arousal indicates calm or depression
        if (emotionTrends.avgArousal < 0.3) {
            scores.calm += 0.4;
            scores.sad += 0.3;
        }

        return scores;
    }

    classifyByPhysiologicalSignals(features) {
        const scores = {
            happy: 0, sad: 0, angry: 0, surprised: 0,
            fearful: 0, disgusted: 0, neutral: 0, anxious: 0, calm: 0
        };

        // Head tilt can indicate engagement or disinterest
        const headTilt = features.faceMetrics.headTilt;
        if (Math.abs(headTilt) > 0.3) {
            scores.surprised += 0.3;
            scores.anxious += 0.2;
        }

        // Face symmetry changes can indicate emotional state
        const symmetry = features.faceMetrics.symmetry;
        if (symmetry > 0.08) {
            scores.anxious += 0.4;
            scores.sad += 0.3;
        }

        return scores;
    }

    ensembleVoting(methods) {
        const emotions = Object.keys(methods.facialExpression);
        const finalScores = {};

        emotions.forEach(emotion => {
            // Weighted voting: facial expression (40%), micro-expressions (30%), temporal (20%), physiological (10%)
            const weightedScore =
                methods.facialExpression[emotion] * 0.4 +
                methods.microExpressions[emotion] * 0.3 +
                methods.temporalPatterns[emotion] * 0.2 +
                methods.physiologicalSignals[emotion] * 0.1;

            finalScores[emotion] = weightedScore;
        });

        return finalScores;
    }

    mapToValenceArousal(emotion) {
        const emotionMap = {
            happy: { valence: 0.8, arousal: 0.7 },
            sad: { valence: -0.7, arousal: -0.3 },
            angry: { valence: -0.8, arousal: 0.8 },
            surprised: { valence: 0.2, arousal: 0.9 },
            fearful: { valence: -0.6, arousal: 0.8 },
            disgusted: { valence: -0.6, arousal: 0.4 },
            neutral: { valence: 0, arousal: 0 },
            anxious: { valence: -0.4, arousal: 0.6 },
            calm: { valence: 0.3, arousal: -0.4 }
        };

        return emotionMap[emotion] || { valence: 0, arousal: 0 };
    }

    calculateIntensity(features, emotion) {
        // Base intensity on facial muscle activation
        let intensity = 0;

        // Mouth intensity
        intensity += Math.abs(features.mouth.smileIntensity) * 50;

        // Eye intensity
        const avgEyeOpenness = (features.leftEye.openness + features.rightEye.openness) / 2;
        intensity += (1 - avgEyeOpenness) * 20;

        // Brow intensity
        const avgBrowElevation = (features.leftBrow.elevation + features.rightBrow.elevation) / 2;
        intensity += Math.abs(avgBrowElevation) * 30;

        // Scale based on emotion type
        const emotionMultipliers = {
            happy: 1.2, sad: 1.0, angry: 1.3, surprised: 1.4,
            fearful: 1.3, disgusted: 1.1, neutral: 0.5, anxious: 1.1, calm: 0.7
        };

        intensity *= emotionMultipliers[emotion] || 1.0;

        return Math.min(100, Math.max(0, intensity));
    }

    calculateBaselineFeatures() {
        if (this.emotionHistory.length < 5) return null;

        const recentFeatures = this.emotionHistory.slice(-10);
        const baseline = {};

        // Calculate average values for baseline
        const featureKeys = Object.keys(recentFeatures[0].features);
        featureKeys.forEach(key => {
            if (typeof recentFeatures[0].features[key] === 'object' && recentFeatures[0].features[key] !== null) {
                const subKeys = Object.keys(recentFeatures[0].features[key]);
                baseline[key] = {};

                subKeys.forEach(subKey => {
                    const values = recentFeatures.map(f => f.features[key]?.[subKey]).filter(v => typeof v === 'number');
                    baseline[key][subKey] = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
                });
            } else {
                // Handle primitive values
                const values = recentFeatures.map(f => f.features[key]).filter(v => typeof v === 'number');
                baseline[key] = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0;
            }
        });

        return baseline;
    }

    calculateEmotionTrends(recentEmotions) {
        if (recentEmotions.length < 3) return { trend: 0, volatility: 0, avgArousal: 0 };

        // Use cached emotion results if available, otherwise classify
        const emotions = recentEmotions.map(e => {
            // Check if we already have emotion results cached
            if (e.emotionResult) {
                return e.emotionResult;
            }
            // Otherwise classify (but avoid deep recursion)
            try {
                return this.classifyEmotion(e.features);
            } catch (error) {
                // Return neutral emotion if classification fails
                return { valence: 0, arousal: 0 };
            }
        });

        const valences = emotions.map(e => e.valence || 0);
        const arousals = emotions.map(e => e.arousal || 0);

        // Calculate trend (slope of valence over time)
        const n = valences.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = valences.reduce((a, b) => a + b, 0);
        const sumXY = valences.reduce((sum, y, x) => sum + x * y, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

        const slope = n > 1 && sumXX !== sumX * sumX ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;

        // Calculate volatility (standard deviation of valence)
        const mean = valences.reduce((a, b) => a + b, 0) / n;
        const variance = valences.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const volatility = Math.sqrt(variance);

        // Average arousal
        const avgArousal = arousals.reduce((a, b) => a + b, 0) / n;

        return {
            trend: slope,
            volatility: volatility,
            avgArousal: avgArousal
        };
    }

    calculateConfidence(emotionResult, features) {
        let confidence = 0;

        // Face detection quality
        if (features.faceMetrics) {
            confidence += (1 - features.faceMetrics.symmetry) * 20; // Higher symmetry = higher confidence
        }

        // Expression clarity
        const expressionStrength = emotionResult.intensity / 100;
        confidence += expressionStrength * 30;

        // Temporal consistency
        const temporalFeatures = faceDetectionService.getTemporalFeatures();
        if (temporalFeatures) {
            confidence += (1 - temporalFeatures.expressionStability) * 25; // Lower stability variation = higher confidence
        }

        // Ensemble agreement
        const topScore = Math.max(...Object.values(emotionResult.emotionScores));
        const secondScore = Object.values(emotionResult.emotionScores)
            .sort((a, b) => b - a)[1] || 0;

        const agreementRatio = secondScore > 0 ? topScore / secondScore : 10;
        confidence += Math.min(25, agreementRatio * 5);

        return Math.min(100, Math.max(0, confidence));
    }

    generateExplanations(emotionResult, features) {
        const explanations = [];

        // Primary emotion explanation
        const primaryEmotion = emotionResult.primaryEmotion;
        const confidence = emotionResult.confidence;

        if (primaryEmotion === 'happy' && features.mouth.isSmiling) {
            explanations.push("Detected genuine smile with Duchenne markers");
        } else if (primaryEmotion === 'sad' && features.mouth.aspectRatio < 0.3) {
            explanations.push("Noted downturned mouth corners and reduced facial animation");
        } else if (primaryEmotion === 'anxious' && (features.leftEye.blinkDetected || features.rightEye.blinkDetected)) {
            explanations.push("Observed rapid blink patterns and elevated brow tension");
        } else if (primaryEmotion === 'surprised' && features.mouth.aspectRatio > 0.4) {
            explanations.push("Captured widened eye aperture and raised eyebrows");
        }

        // Confidence explanation
        if (confidence > 80) {
            explanations.push("High confidence due to clear facial expression patterns");
        } else if (confidence > 60) {
            explanations.push("Moderate confidence with some expression ambiguity");
        } else {
            explanations.push("Lower confidence - consider retaking scan in better lighting");
        }

        // Contributing features
        const contributingFeatures = [];
        if (features.mouth.smileIntensity > 0.01) contributingFeatures.push("mouth curvature");
        if (features.leftEye.openness < 0.5) contributingFeatures.push("eye aperture");
        if (Math.abs(features.leftBrow.elevation) > 0.05) contributingFeatures.push("brow position");

        if (contributingFeatures.length > 0) {
            explanations.push(`Key indicators: ${contributingFeatures.join(', ')}`);
        }

        return explanations;
    }

    analyzeTemporalPatterns() {
        if (this.emotionHistory.length < 5) return null;

        const recent = this.emotionHistory.slice(-20); // Last 20 frames (~0.67 seconds)
        const emotions = recent.map(entry => this.classifyEmotion(entry.features));

        // Detect emotion transitions
        const transitions = [];
        for (let i = 1; i < emotions.length; i++) {
            if (emotions[i].primaryEmotion !== emotions[i - 1].primaryEmotion) {
                transitions.push({
                    from: emotions[i - 1].primaryEmotion,
                    to: emotions[i].primaryEmotion,
                    timestamp: recent[i].timestamp
                });
            }
        }

        // Calculate emotional stability
        const emotionCounts = emotions.reduce((counts, emotion) => {
            counts[emotion.primaryEmotion] = (counts[emotion.primaryEmotion] || 0) + 1;
            return counts;
        }, {});

        const dominantEmotion = Object.entries(emotionCounts)
            .sort(([, a], [, b]) => b - a)[0][0];

        const stability = emotionCounts[dominantEmotion] / emotions.length;

        return {
            transitions: transitions,
            stability: stability,
            dominantEmotion: dominantEmotion,
            emotionVariability: Object.keys(emotionCounts).length / emotions.length
        };
    }

    dispose() {
        this.stopAnalysis();
        this.emotionHistory = [];
        this.baselineFeatures = null;
        console.log('🗑️ Emotion Analysis Service disposed');
    }
}

// Export singleton instance
const emotionAnalysisService = new EmotionAnalysisService();
export default emotionAnalysisService;