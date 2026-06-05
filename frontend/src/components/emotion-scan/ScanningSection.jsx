import React, { memo, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle } from "lucide-react";
import Webcam from "react-webcam";

const ScanningOverlay = memo(() => (
    <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
    >
        <motion.div
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_6px_rgba(139,28,47,0.3)]"
            animate={{ top: ["0%", "100%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 border border-primary/40 rounded-full"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity }}
        />
    </motion.div>
));

const ScanningSection = memo(({ videoRef, scanProgress, detectedFeatures, onTakePhoto, onCameraError, stage }) => {
    const [cameraReady, setCameraReady] = useState(false);
    const webcamRef = React.useRef(null);

    const bindVideoElement = useCallback(() => {
        const video = webcamRef.current?.video;
        if (video && videoRef) {
            videoRef.current = video;
            setCameraReady(video.videoWidth > 0 && video.videoHeight > 0);
        }
    }, [videoRef]);

    useEffect(() => {
        if (stage === "preview" || stage === "scanning") {
            bindVideoElement();
            return;
        }
        setCameraReady(false);
    }, [bindVideoElement, stage]);

    const handleTakePhoto = useCallback(() => {
        if (!cameraReady) return;
        onTakePhoto?.();
    }, [cameraReady, onTakePhoto]);

    if (stage === "preview") {
        return (
            <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
            >
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                        Camera Preview
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Position yourself comfortably and ensure good lighting
                    </p>
                </div>

                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl shadow-primary/10">
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        mirrored
                        videoConstraints={{ facingMode: "user" }}
                        onUserMedia={bindVideoElement}
                        onUserMediaError={onCameraError}
                        onLoadedMetadata={bindVideoElement}
                        onCanPlay={bindVideoElement}
                        style={{ width: "100%", height: "100%" }}
                    />
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        When you're ready, we'll take a photo for emotion analysis
                    </p>
                    <button
                        onClick={handleTakePhoto}
                        disabled={!cameraReady}
                        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cameraReady ? "I'm Ready - Take Photo" : "Preparing camera..."}
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="scanning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center space-y-6"
        >
            <div className="space-y-2">
                <h2 className="text-xl font-bold text-foreground">
                    AI Emotional Analysis
                </h2>
                <p className="text-sm text-muted-foreground">
                    Advanced face scanning with real-time emotion detection
                </p>
                <p className="text-xs text-muted-foreground">
                    Analyzing facial expressions...
                </p>
            </div>

            <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/50 shadow-xl shadow-primary/10">
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    mirrored
                    videoConstraints={{ facingMode: "user" }}
                    onUserMedia={bindVideoElement}
                    onUserMediaError={onCameraError}
                    onLoadedMetadata={bindVideoElement}
                    onCanPlay={bindVideoElement}
                    style={{ width: "100%", height: "100%" }}
                />
                <ScanningOverlay />

                {detectedFeatures.length > 0 && (
                    <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
                        {detectedFeatures.slice(-3).map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 text-[11px] md:text-xs text-primary-foreground bg-primary/80 backdrop-blur-sm px-2.5 py-1 rounded-lg"
                            >
                                <CheckCircle className="w-3 h-3" />
                                {feature}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground font-semibold">{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-surface/50 overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${scanProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Brain className="w-4 h-4 animate-pulse text-primary" />
                Advanced AI analysis in progress...
            </div>
        </motion.div>
    );
});

ScanningSection.displayName = "ScanningSection";
export default ScanningSection;
