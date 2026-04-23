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
    const [stream, setStream] = useState(null);
    const [scanProgress, setScanProgress] = useState(0);
    const [detectedFeatures, setDetectedFeatures] = useState([]);
    const [rescanCount, setRescanCount] = useState(0);
    const videoRef = useRef(null);
    const scanIntervalRef = useRef(null);
    const stopActiveVideoTracks = useCallback(() => {
        const activeStream = videoRef.current?.srcObject || stream;

        if (activeStream?.getTracks) {
            activeStream.getTracks().forEach((track) => track.stop());
        }

        setStream(null);
    }, [stream]);

    const startScan = useCallback(async () => {
        setScanProgress(0);
        setDetectedFeatures([]);
        setStage("preview");
    }, []);

    // Auto-start camera when autoStart is true (skip intro)
    useEffect(() => {
        if (autoStart) {
            startScan();
        }
    }, [autoStart, startScan]);

    const capturePhoto = useCallback(async () => {
        try {
            if (!videoRef.current) {
                throw new Error("Video element not available");
            }

            const sourceWidth = videoRef.current.videoWidth || 640;
            const sourceHeight = videoRef.current.videoHeight || 480;
            const maxDimension = 960;
            const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = Math.max(1, Math.round(sourceWidth * scale));
            canvas.height = Math.max(1, Math.round(sourceHeight * scale));
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

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

            stopActiveVideoTracks();
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
        }
    }, [autoStart, initialStage, stopActiveVideoTracks, toast]);

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
        stopActiveVideoTracks();
        setStage(initialStage);
        setScanProgress(0);
        setDetectedFeatures([]);
    }, [initialStage, stopActiveVideoTracks]);

    const handleRescanRequest = useCallback(() => {
        if (rescanCount >= maxRescanAttempts) {
            return;
        }
        setRescanCount((prev) => prev + 1);
        resetScan();
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

            stopActiveVideoTracks();
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
                scanIntervalRef.current = null;
            }
        };
    }, [stopActiveVideoTracks]);

    return {
        stage,
        setStage,
        stream,
        setStream,
        scanProgress,
        setScanProgress,
        detectedFeatures,
        setDetectedFeatures,
        startScan,
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
