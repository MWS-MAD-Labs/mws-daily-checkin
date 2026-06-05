import { useCallback, useEffect, useMemo, useRef, useState } from "react";

let emotionAnalysisServicePromise = null;
const loadEmotionAnalysisService = async () => {
    if (!emotionAnalysisServicePromise) {
        emotionAnalysisServicePromise = import("@/services/emotionAnalysisService")
            .then((mod) => mod.default)
            .catch((error) => {
                emotionAnalysisServicePromise = null;
                throw error;
            });
    }
    return emotionAnalysisServicePromise;
};

const DEFAULT_STAGE = "intro";

export const useCameraScanner = ({
    toast,
    maxRescanAttempts = 2,
    autoStart = false
}) => {
    const initialStage = autoStart ? "preview" : DEFAULT_STAGE;
    const [stage, setStage] = useState(initialStage);
    const [cameraError, setCameraError] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [detectedFeatures, setDetectedFeatures] = useState([]);
    const [rescanCount, setRescanCount] = useState(0);
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);

    const stopVideoStream = useCallback(() => {
        const video = videoRef.current;
        const activeStream = video?.srcObject;
        if (activeStream && typeof activeStream.getTracks === "function") {
            activeStream.getTracks().forEach((track) => track.stop());
        }
        if (video) {
            try {
                video.srcObject = null;
            } catch {
                // Browser owns this property; failure to detach is non-fatal.
            }
        }
    }, []);

    const startScan = useCallback(() => {
        setCameraError(null);
        setScanProgress(0);
        setDetectedFeatures([]);
        setStage("preview");
    }, []);

    const handleCameraError = useCallback((error) => {
        console.error("Camera access error:", error);
        setCameraError(error);
        setStage("camera-error");
        toast?.({
            title: "Camera Access Required",
            description: "Please allow camera access, close other apps using the camera, then try again.",
            variant: "destructive"
        });
    }, [toast]);

    useEffect(() => {
        if (autoStart) {
            startScan();
        }
    }, [autoStart, startScan]);

    const capturePhoto = useCallback(async () => {
        try {
            const video = videoRef.current;
            if (!video) {
                throw new Error("Video element not available");
            }

            const hasFrame =
                video.readyState >= 2 &&
                video.videoWidth > 0 &&
                video.videoHeight > 0;

            if (!hasFrame) {
                toast?.({
                    title: "Camera warming up",
                    description: "Please wait a moment for the camera to stabilize, then try again.",
                    variant: "destructive"
                });
                return null;
            }

            const sourceWidth = video.videoWidth;
            const sourceHeight = video.videoHeight;
            const maxDimension = 960;
            const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = Math.max(1, Math.round(sourceWidth * scale));
            canvas.height = Math.max(1, Math.round(sourceHeight * scale));
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const photoBlob = await new Promise((resolve, reject) => {
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                            return;
                        }
                        reject(new Error("Photo capture produced no image data"));
                    },
                    "image/jpeg",
                    0.82
                );
            });

            stopVideoStream();
            setStage("analyzing");
            return photoBlob;
        } catch (error) {
            console.error("Photo capture failed:", error);
            toast?.({
                title: "Photo Capture Failed",
                description: "Unable to capture photo for analysis.",
                variant: "destructive"
            });
            setStage(autoStart ? "preview" : initialStage);
            return null;
        }
    }, [autoStart, initialStage, stopVideoStream, toast]);

    const resetScan = useCallback(async () => {
        try {
            const emotionAnalysisService = await loadEmotionAnalysisService();
            emotionAnalysisService.stopAnalysis();
        } catch {
            // Service may never be needed in this session.
        }

        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        stopVideoStream();
        setCameraError(null);
        setStage(initialStage);
        setScanProgress(0);
        setDetectedFeatures([]);
    }, [initialStage, stopVideoStream]);

    const handleRescanRequest = useCallback(async () => {
        if (rescanCount >= maxRescanAttempts) {
            return;
        }
        setRescanCount((prev) => prev + 1);
        await resetScan();
        if (autoStart) {
            startScan();
        }
    }, [autoStart, maxRescanAttempts, resetScan, rescanCount, startScan]);

    const remainingRescans = useMemo(
        () => Math.max(maxRescanAttempts - rescanCount, 0),
        [maxRescanAttempts, rescanCount]
    );
    const isRescanDisabled = remainingRescans <= 0;

    useEffect(() => {
        return () => {
            loadEmotionAnalysisService()
                .then((emotionAnalysisService) => {
                    emotionAnalysisService.dispose();
                })
                .catch(() => {
                    // Never loaded, nothing to dispose.
                });

            stopVideoStream();
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
        };
    }, [stopVideoStream]);

    return {
        stage,
        setStage,
        cameraError,
        scanProgress,
        setScanProgress,
        detectedFeatures,
        setDetectedFeatures,
        startScan,
        handleCameraError,
        capturePhoto,
        resetScan,
        handleRescanRequest,
        isRescanDisabled,
        remainingRescans,
        rescanCount,
        videoRef,
        scanIntervalRef
    };
};
