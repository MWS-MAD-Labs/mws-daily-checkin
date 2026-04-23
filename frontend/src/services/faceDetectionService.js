let tfModule = null;
let FaceMeshClass = null;
let CameraClass = null;
let visionStackPromise = null;

const loadVisionStack = async () => {
    if (!visionStackPromise) {
        visionStackPromise = Promise.all([
            import('@tensorflow/tfjs'),
            import('@mediapipe/face_mesh'),
            import('@mediapipe/camera_utils')
        ])
            .then(([tfImport, faceMeshImport, cameraImport]) => {
                tfModule = tfImport;
                FaceMeshClass = faceMeshImport.FaceMesh;
                CameraClass = cameraImport.Camera;
            })
            .catch((error) => {
                visionStackPromise = null;
                throw error;
            });
    }
    return visionStackPromise;
};

export const preloadVisionStack = () => loadVisionStack();

class FaceDetectionService {
    constructor() {
        this.faceMesh = null;
        this.camera = null;
        this.isInitialized = false;
        this.onResultsCallback = null;
        this.currentResults = null;
        this.landmarkHistory = [];
        this.maxHistoryLength = 30; // 1 second at 30fps
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            await loadVisionStack();

            // Initialize TensorFlow.js
            await tfModule.ready();
            await tfModule.setBackend('webgl');

            // Initialize MediaPipe Face Mesh
            this.faceMesh = new FaceMeshClass({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                }
            });

            // Configure Face Mesh
            this.faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // Set results callback
            this.faceMesh.onResults((results) => {
                this.handleResults(results);
            });

            this.isInitialized = true;
            console.log('🤖 Face Detection Service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Face Detection Service:', error);
            throw error;
        }
    }

    handleResults(results) {
        this.currentResults = results;

        // Store landmark history for temporal analysis
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            this.landmarkHistory.push({
                timestamp: Date.now(),
                landmarks: landmarks.map(point => ({ x: point.x, y: point.y, z: point.z }))
            });

            // Keep only recent history
            if (this.landmarkHistory.length > this.maxHistoryLength) {
                this.landmarkHistory.shift();
            }
        }

        // Call user callback if set
        if (this.onResultsCallback) {
            this.onResultsCallback(results);
        }
    }

    startCamera(videoElement, onResults) {
        if (!this.isInitialized) {
            throw new Error('Face Detection Service not initialized');
        }

        this.onResultsCallback = onResults;

        this.camera = new CameraClass(videoElement, {
            onFrame: async () => {
                if (this.faceMesh) {
                    await this.faceMesh.send({ image: videoElement });
                }
            },
            width: 640,
            height: 480
        });

        this.camera.start();
        console.log('📹 Camera started for face detection');
    }

    stopCamera() {
        if (this.camera) {
            this.camera.stop();
            this.camera = null;
        }
        this.onResultsCallback = null;
        this.currentResults = null;
        this.landmarkHistory = [];
        console.log('📹 Camera stopped');
    }

    getCurrentResults() {
        return this.currentResults;
    }

    getLandmarkHistory() {
        return this.landmarkHistory;
    }

    // Extract facial features for emotion analysis
    extractFeatures(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            return null;
        }

        const landmarks = results.multiFaceLandmarks[0];

        // Key facial regions for emotion analysis
        const features = {
            // Eye features
            leftEye: this.getEyeFeatures(landmarks, 'left'),
            rightEye: this.getEyeFeatures(landmarks, 'right'),

            // Mouth features
            mouth: this.getMouthFeatures(landmarks),

            // Brow features
            leftBrow: this.getBrowFeatures(landmarks, 'left'),
            rightBrow: this.getBrowFeatures(landmarks, 'right'),

            // Cheek features
            cheeks: this.getCheekFeatures(landmarks),

            // Nose features
            nose: this.getNoseFeatures(landmarks),

            // Overall face metrics
            faceMetrics: this.getFaceMetrics(landmarks),

            // Temporal features (from history)
            temporalFeatures: this.getTemporalFeatures()
        };

        return features;
    }

    getEyeFeatures(landmarks, side) {
        const eyeIndices = side === 'left'
            ? [33, 160, 158, 133, 153, 144] // Left eye landmarks
            : [362, 385, 387, 263, 373, 380]; // Right eye landmarks

        const eyePoints = eyeIndices.map(idx => landmarks[idx]);

        // Calculate eye aspect ratio (EAR) for blink detection
        const ear = this.calculateEyeAspectRatio(eyePoints);

        // Calculate eye openness
        const eyeHeight = Math.abs(eyePoints[1].y - eyePoints[5].y);
        const eyeWidth = Math.abs(eyePoints[0].x - eyePoints[3].x);
        const eyeOpenness = eyeHeight / eyeWidth;

        return {
            aspectRatio: ear,
            openness: eyeOpenness,
            blinkDetected: ear < 0.2, // Threshold for blink detection
            coordinates: eyePoints
        };
    }

    getMouthFeatures(landmarks) {
        const mouthIndices = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
        const mouthPoints = mouthIndices.map(idx => landmarks[idx]);

        // Calculate mouth aspect ratio
        const mouthWidth = Math.abs(mouthPoints[0].x - mouthPoints[10].x);
        const mouthHeight = Math.abs(mouthPoints[3].y - mouthPoints[9].y);
        const mouthAspectRatio = mouthHeight / mouthWidth;

        // Calculate smile intensity (corner lift)
        const leftCorner = mouthPoints[0];
        const rightCorner = mouthPoints[10];
        const mouthCenter = mouthPoints[9];
        const smileIntensity = (leftCorner.y + rightCorner.y) / 2 - mouthCenter.y;

        return {
            aspectRatio: mouthAspectRatio,
            smileIntensity: smileIntensity,
            isSmiling: smileIntensity > 0.01,
            coordinates: mouthPoints
        };
    }

    getBrowFeatures(landmarks, side) {
        const browIndices = side === 'left'
            ? [70, 63, 105, 66, 107] // Left brow landmarks
            : [336, 296, 334, 293, 300]; // Right brow landmarks

        const browPoints = browIndices.map(idx => landmarks[idx]);

        // Calculate brow elevation (how raised the brows are)
        const browElevation = browPoints.reduce((sum, point) => sum + point.y, 0) / browPoints.length;

        // Calculate brow furrowing (inner brow distance)
        const innerBrowDistance = Math.abs(browPoints[2].x - browPoints[4].x);

        return {
            elevation: browElevation,
            furrowing: innerBrowDistance,
            coordinates: browPoints
        };
    }

    getCheekFeatures(landmarks) {
        const cheekIndices = [50, 101, 118, 117, 119, 100, 36, 137, 205, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216];
        const cheekPoints = cheekIndices.map(idx => landmarks[idx]);

        // Calculate cheek puffiness (bulging)
        const cheekPuffiness = cheekPoints.reduce((sum, point) => sum + point.z, 0) / cheekPoints.length;

        return {
            puffiness: cheekPuffiness,
            coordinates: cheekPoints
        };
    }

    getNoseFeatures(landmarks) {
        const noseIndices = [1, 2, 3, 4, 5, 6, 197, 195, 5, 4, 45, 275];
        const nosePoints = noseIndices.map(idx => landmarks[idx]);

        // Calculate nose wrinkling (nasal flare)
        const noseWrinkling = Math.abs(nosePoints[0].z - nosePoints[6].z);

        return {
            wrinkling: noseWrinkling,
            coordinates: nosePoints
        };
    }

    getFaceMetrics(landmarks) {
        // Calculate overall face symmetry
        const leftSide = landmarks.slice(0, 234); // Left half of face
        const rightSide = landmarks.slice(234); // Right half of face

        const symmetry = this.calculateFacialSymmetry(leftSide, rightSide);

        // Calculate head pose (basic)
        const noseBridge = landmarks[6];
        const chin = landmarks[152];
        const headTilt = Math.atan2(chin.y - noseBridge.y, chin.x - noseBridge.x);

        return {
            symmetry: symmetry,
            headTilt: headTilt,
            faceWidth: Math.abs(landmarks[234].x - landmarks[454].x),
            faceHeight: Math.abs(landmarks[10].y - landmarks[152].y)
        };
    }

    getTemporalFeatures() {
        if (this.landmarkHistory.length < 2) return null;

        const recent = this.landmarkHistory.slice(-10); // Last 10 frames
        const features = {
            blinkRate: this.calculateBlinkRate(recent),
            expressionStability: this.calculateExpressionStability(recent),
            microMovements: this.detectMicroMovements(recent)
        };

        return features;
    }

    calculateEyeAspectRatio(eyePoints) {
        // EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        // eyePoints is already the mapped array from eyeIndices
        const p1 = eyePoints[0], p2 = eyePoints[1], p3 = eyePoints[2], p4 = eyePoints[3], p5 = eyePoints[4], p6 = eyePoints[5];

        const vertical1 = Math.sqrt(Math.pow(p2.x - p6.x, 2) + Math.pow(p2.y - p6.y, 2));
        const vertical2 = Math.sqrt(Math.pow(p3.x - p5.x, 2) + Math.pow(p3.y - p5.y, 2));
        const horizontal = Math.sqrt(Math.pow(p1.x - p4.x, 2) + Math.pow(p1.y - p4.y, 2));

        return horizontal === 0 ? 0 : (vertical1 + vertical2) / (2 * horizontal);
    }

    calculateFacialSymmetry(leftSide, rightSide) {
        let symmetryScore = 0;
        const points = Math.min(leftSide.length, rightSide.length);

        for (let i = 0; i < points; i++) {
            const left = leftSide[i];
            const right = rightSide[i];
            const distance = Math.sqrt(
                Math.pow(left.x - (-right.x), 2) + // Mirror x-coordinate
                Math.pow(left.y - right.y, 2) +
                Math.pow(left.z - right.z, 2)
            );
            symmetryScore += distance;
        }

        return symmetryScore / points; // Lower score = more symmetric
    }

    calculateBlinkRate(recentFrames) {
        let blinkCount = 0;
        for (let i = 1; i < recentFrames.length; i++) {
            const prevFrame = recentFrames[i - 1];
            const currFrame = recentFrames[i];

            // Check if blink occurred (EAR dropped significantly)
            const prevEAR = this.calculateEyeAspectRatio(prevFrame.landmarks.slice(33, 39)); // Left eye landmarks
            const currEAR = this.calculateEyeAspectRatio(currFrame.landmarks.slice(33, 39));

            if (prevEAR > 0.25 && currEAR < 0.2) {
                blinkCount++;
            }
        }

        // Calculate blinks per minute (assuming 30fps)
        return (blinkCount / (recentFrames.length / 30)) * 60;
    }

    calculateExpressionStability(recentFrames) {
        let totalVariation = 0;

        for (let i = 1; i < recentFrames.length; i++) {
            const prev = recentFrames[i - 1].landmarks;
            const curr = recentFrames[i].landmarks;

            let frameVariation = 0;
            for (let j = 0; j < Math.min(prev.length, curr.length); j++) {
                const distance = Math.sqrt(
                    Math.pow(prev[j].x - curr[j].x, 2) +
                    Math.pow(prev[j].y - curr[j].y, 2) +
                    Math.pow(prev[j].z - curr[j].z, 2)
                );
                frameVariation += distance;
            }
            totalVariation += frameVariation / prev.length;
        }

        return totalVariation / (recentFrames.length - 1); // Lower = more stable
    }

    detectMicroMovements(recentFrames) {
        const movements = [];

        for (let i = 1; i < recentFrames.length; i++) {
            const prev = recentFrames[i - 1].landmarks;
            const curr = recentFrames[i].landmarks;

            for (let j = 0; j < Math.min(prev.length, curr.length); j++) {
                const movement = Math.sqrt(
                    Math.pow(prev[j].x - curr[j].x, 2) +
                    Math.pow(prev[j].y - curr[j].y, 2) +
                    Math.pow(prev[j].z - curr[j].z, 2)
                );

                if (movement > 0.001 && movement < 0.01) { // Micro-movement threshold
                    movements.push({
                        landmark: j,
                        magnitude: movement,
                        timestamp: recentFrames[i].timestamp
                    });
                }
            }
        }

        return movements;
    }

    dispose() {
        this.stopCamera();
        if (this.faceMesh) {
            this.faceMesh.close();
            this.faceMesh = null;
        }
        this.isInitialized = false;
        console.log('🗑️ Face Detection Service disposed');
    }
}

// Export singleton instance
const faceDetectionService = new FaceDetectionService();
export default faceDetectionService;
