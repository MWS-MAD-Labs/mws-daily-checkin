import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Shield, Camera, Brain, CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import Webcam from "react-webcam";
import AnimatedPage from "@/components/AnimatedPage";
import { useToast } from "@/components/ui/use-toast";
import StudentResultsSection from "@/components/emotion-scan/StudentResultsSection";
import { useDispatch, useSelector } from "react-redux";
import { fetchSupportContacts } from "@/store/slices/supportSlice";
import { useCameraScanner } from "@/pages/verification/hooks/useCameraScanner";
import { useEmotionAnalysis } from "@/pages/verification/hooks/useEmotionAnalysis";
import { useCheckinSubmission } from "@/pages/verification/hooks/useCheckinSubmission";
import "@/pages/styles/student-ios-system.css";

const MAX_AI_RESCAN_ATTEMPTS = 2;

/* Scoped styles matching Hub design */
const ScanStyles = memo(() => (
    <style>{`
        @keyframes sfBgShift{0%{background-position:0% 0%}25%{background-position:50% 100%}50%{background-position:100% 50%}75%{background-position:50% 0%}100%{background-position:0% 0%}}
        .sf-bg{background-size:300% 300%;animation:sfBgShift 16s ease infinite}
        :is(.dark) .sf-bg{animation:none}
        .sf-grid{background-image:radial-gradient(circle,rgba(0,0,0,.04) 1px,transparent 1px);background-size:24px 24px}
        :is(.dark) .sf-grid{background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px)}
        .sf-font{font-family:'Nunito','Inter',system-ui,-apple-system,sans-serif;letter-spacing:-0.01em}
        @keyframes sfBlob{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(12px,-8px) scale(1.04) rotate(1deg)}50%{transform:translate(-4px,10px) scale(.97) rotate(-1deg)}75%{transform:translate(-10px,-4px) scale(1.02) rotate(.5deg)}}
        @keyframes sfFloat{0%,100%{transform:translateY(0) scale(1);opacity:.55}50%{transform:translateY(-10px) scale(1.12);opacity:.85}}
        @keyframes sfPulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.25);opacity:.7}}
        @keyframes sfScanLine{0%{top:0%}100%{top:100%}}
        @keyframes sfRingPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.3}50%{transform:translate(-50%,-50%) scale(1.15);opacity:.6}}
    `}</style>
));
ScanStyles.displayName = "ScanStyles";

/* Particles for the scan page */
const sfParticles = [
    { top: '5%', left: '8%', sz: 7, cl: 'bg-rose-300 dark:bg-rose-500/25', dur: 4.2 },
    { top: '12%', right: '10%', sz: 6, cl: 'bg-violet-300 dark:bg-violet-500/25', dur: 5 },
    { top: '40%', left: '4%', sz: 8, cl: 'bg-sky-300 dark:bg-sky-500/25', dur: 4.5 },
    { top: '65%', right: '6%', sz: 5, cl: 'bg-amber-300 dark:bg-amber-500/25', dur: 5.5 },
    { top: '85%', left: '12%', sz: 6, cl: 'bg-emerald-300 dark:bg-emerald-500/25', dur: 3.8 },
    { top: '75%', right: '14%', sz: 7, cl: 'bg-pink-300 dark:bg-pink-500/25', dur: 4.8 },
];

/* Camera scanning overlay (student-styled) */
const StudentScanOverlay = memo(() => (
    <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_8px_rgba(139,92,246,0.4)]" style={{ animation: 'sfScanLine 2.5s linear infinite' }} />
        <div className="absolute top-1/2 left-1/2 w-14 h-14 border-2 border-violet-400/40 rounded-full" style={{ animation: 'sfRingPulse 2.5s ease-in-out infinite' }} />
    </div>
));

const StudentFaceScanPage = memo(() => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const dispatch = useDispatch();
    const { contacts: supportContacts } = useSelector((state) => state.support);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const rescanLimitNoticeShownRef = useRef(false);
    const webcamRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);

    const {
        stage, setStage, videoRef, scanProgress, detectedFeatures,
        capturePhoto, handleRescanRequest,
        isRescanDisabled, remainingRescans
    } = useCameraScanner({ toast, maxRescanAttempts: MAX_AI_RESCAN_ATTEMPTS, autoStart: true });

    const {
        analysis, setAnalysis, analyzePhoto,
        selectedSupportContact, setSelectedSupportContact
    } = useEmotionAnalysis({ toast, setStage, fallbackStage: "preview" });

    const { isSubmitting, completeCheckin } = useCheckinSubmission({
        analysis, selectedSupportContact, supportContacts, toast, navigate
    });

    const bindVideoElement = useCallback(() => {
        if (webcamRef.current?.video && videoRef) {
            videoRef.current = webcamRef.current.video;
            setCameraReady(true);
        }
    }, [videoRef]);

    const handleCameraError = useCallback(() => {
        setCameraReady(false);
        toast({
            title: "Camera Access Required",
            description: "Please allow camera access so the AI scan can start.",
            variant: "destructive"
        });
    }, [toast]);

    // Keep trying to bind video element when preview/scanning renders.
    useEffect(() => {
        if (stage === "preview" || stage === "scanning") {
            bindVideoElement();
        }
        if (stage === "loading") {
            setCameraReady(false);
        }
    }, [bindVideoElement, stage]);

    const handleTakePhoto = useCallback(async () => {
        if (!cameraReady) {
            toast({
                title: "Camera not ready",
                description: "Please wait a moment until camera is fully loaded.",
                variant: "destructive"
            });
            return;
        }

        const photoDataUrl = await capturePhoto();
        if (photoDataUrl) {
            await analyzePhoto(photoDataUrl);
        }
    }, [analyzePhoto, cameraReady, capturePhoto, toast]);

    const handleRescan = useCallback(() => {
        setAnalysis(null);
        setSelectedSupportContact(null);
        handleRescanRequest();
    }, [handleRescanRequest, setAnalysis, setSelectedSupportContact]);

    const handleReflectionChange = useCallback((reflection) => {
        setAnalysis((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                userReflection: reflection
            };
        });
    }, [setAnalysis]);

    useEffect(() => {
        if (supportContacts.length === 0 && isAuthenticated) {
            dispatch(fetchSupportContacts());
        }
    }, [dispatch, isAuthenticated, supportContacts.length]);

    useEffect(() => {
        if (stage === "results" && analysis && isRescanDisabled && !rescanLimitNoticeShownRef.current) {
            rescanLimitNoticeShownRef.current = true;
            toast({
                title: "Rescan Quota Exhausted",
                description: "You have used all AI rescan quota (2x). Please proceed with check-in or save this analysis result.",
                variant: "destructive"
            });
        }
        if (!isRescanDisabled) {
            rescanLimitNoticeShownRef.current = false;
        }
    }, [analysis, isRescanDisabled, stage, toast]);

    const analysisForView = analysis ? { ...analysis, isSubmitting } : null;
    const isFullWidth = stage === "results";

    return (
        <AnimatedPage>
            <Helmet><title>AI Face Scan - Student</title></Helmet>
            <ScanStyles />

            <div
                className="sf-bg sf-font student-shell min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-50 via-rose-50 via-50% to-amber-50 dark:from-background dark:via-background dark:to-background"
                data-student-theme="scan"
            >
                {/* Dot grid */}
                <div className="sf-grid absolute inset-0 pointer-events-none" />

                {/* Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-16 w-80 sm:w-[400px] h-80 sm:h-[400px] rounded-full blur-3xl bg-gradient-to-br from-violet-200/50 via-purple-200/35 to-pink-100/25 dark:from-violet-500/8 dark:via-purple-500/4 dark:to-transparent" style={{ animation: 'sfBlob 10s ease-in-out infinite' }} />
                    <div className="absolute -bottom-16 -left-16 w-72 sm:w-[360px] h-72 sm:h-[360px] rounded-full blur-3xl bg-gradient-to-br from-rose-200/50 via-orange-200/35 to-amber-100/25 dark:from-rose-500/8 dark:via-orange-500/4 dark:to-transparent" style={{ animation: 'sfBlob 12s ease-in-out infinite', animationDelay: '3s' }} />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 sm:w-80 h-64 sm:h-80 rounded-full blur-3xl bg-gradient-to-br from-sky-100/40 via-cyan-100/25 to-transparent dark:from-sky-500/5 dark:to-transparent" style={{ animation: 'sfBlob 9s ease-in-out infinite', animationDelay: '1.5s' }} />
                    {sfParticles.map((p, i) => (
                        <div key={i} className={`absolute rounded-full pointer-events-none ${p.cl}`} style={{ top: p.top, left: p.left, right: p.right, width: p.sz, height: p.sz, animation: `sfFloat ${p.dur}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
                    ))}
                </div>

                {/* Content */}
                <div className={`relative z-10 flex flex-col min-h-screen ${isFullWidth ? 'p-4 sm:p-6' : 'items-center justify-center px-4 pt-8 pb-10 sm:pt-12 sm:pb-16'}`}>

                    {/* Back button (non-results) */}
                    {!isFullWidth && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={isFullWidth ? "mb-4" : "absolute top-6 left-4 sm:top-8 sm:left-6"}
                        >
                            <button
                                onClick={() => navigate('/student/emotional-checkin/ai')}
                                className="ios-pill flex h-10 w-10 items-center justify-center rounded-full bg-white/60 dark:bg-white/8 border border-white/80 dark:border-white/10 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </button>
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* Loading / requesting camera */}
                        {stage === "loading" && (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4">
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-14 h-14 mx-auto">
                                    <Camera className="w-full h-full text-violet-400" />
                                </motion.div>
                                <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">Starting camera...</p>
                            </motion.div>
                        )}

                        {/* Camera Preview - student styled */}
                        {stage === "preview" && (
                            <motion.div key="preview" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-md text-center space-y-5">
                                {/* Pill */}
                                <div className="ios-pill inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-gray-200/40 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <Camera className="w-3 h-3 text-violet-500" />
                                    <span className="text-[11px] font-extrabold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Camera Ready</span>
                                </div>

                                <h2 className="text-xl sm:text-2xl font-black text-gray-700 dark:text-white">
                                    Show your best face! 😊
                                </h2>
                                <p className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">
                                    Position yourself comfortably and ensure good lighting
                                </p>

                                {/* Camera feed */}
                                <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-violet-300/50 dark:border-violet-500/20 shadow-xl shadow-violet-500/10">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        mirrored
                                        videoConstraints={{ facingMode: "user" }}
                                        onUserMedia={bindVideoElement}
                                        onLoadedMetadata={bindVideoElement}
                                        onUserMediaError={handleCameraError}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                </div>

                                {/* Take photo button */}
                                <motion.button
                                    onClick={handleTakePhoto}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    disabled={!cameraReady}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 text-white font-extrabold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-shadow duration-300 flex items-center justify-center gap-2"
                                >
                                    <Camera className="w-5 h-5" />
                                    {cameraReady ? "I'm Ready - Take Photo" : "Preparing camera..."}
                                </motion.button>

                                <p className="text-[10px] text-gray-300 dark:text-gray-600 font-semibold flex items-center justify-center gap-1.5">
                                    <Shield className="w-3 h-3" />
                                    No photos are saved - 100% private
                                </p>
                            </motion.div>
                        )}

                        {/* Scanning in progress */}
                        {stage === "scanning" && (
                            <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full max-w-md text-center space-y-5">
                                <div className="ios-pill inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-gray-200/40 dark:border-white/10 backdrop-blur-sm shadow-sm">
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span className="text-[11px] font-extrabold tracking-wide text-gray-500 dark:text-gray-400 uppercase">Scanning</span>
                                </div>

                                <h2 className="text-xl font-black text-gray-700 dark:text-white">
                                    Reading your expressions...
                                </h2>

                                <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-violet-300/50 dark:border-violet-500/20 shadow-xl shadow-violet-500/10">
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        mirrored
                                        videoConstraints={{ facingMode: "user" }}
                                        onUserMedia={bindVideoElement}
                                        onLoadedMetadata={bindVideoElement}
                                        onUserMediaError={handleCameraError}
                                        style={{ width: "100%", height: "100%" }}
                                    />
                                    <StudentScanOverlay />

                                    {detectedFeatures.length > 0 && (
                                        <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
                                            {detectedFeatures.slice(-3).map((feature, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-center gap-2 text-[11px] text-white bg-violet-500/80 backdrop-blur-sm px-2.5 py-1 rounded-lg"
                                                >
                                                    <CheckCircle className="w-3 h-3" />
                                                    {feature}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400 dark:text-gray-500 font-medium">Progress</span>
                                        <span className="font-extrabold text-gray-700 dark:text-white">{Math.round(scanProgress)}%</span>
                                    </div>
                                    <div className="h-2.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${scanProgress}%` }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500 font-medium">
                                    <Brain className="w-4 h-4 animate-pulse text-violet-500" />
                                    AI analysis in progress...
                                </div>
                            </motion.div>
                        )}

                        {/* Analyzing */}
                        {stage === "analyzing" && (
                            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-5 py-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 mx-auto"
                                >
                                    <Brain className="w-full h-full text-violet-500" />
                                </motion.div>
                                <div className="space-y-2">
                                    <h2 className="text-xl font-black text-gray-700 dark:text-white">
                                        Analyzing Emotions
                                    </h2>
                                    <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                                        Our AI is understanding your feelings...
                                    </p>
                                </div>
                                <div className="flex justify-center gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2.5 h-2.5 rounded-full bg-violet-400"
                                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Results - uses StudentResultsSection */}
                        {stage === "results" && analysisForView && (
                            <StudentResultsSection
                                analysis={analysisForView}
                                onReset={handleRescan}
                                onComplete={completeCheckin}
                                onSupportChange={setSelectedSupportContact}
                                onReflectionChange={handleReflectionChange}
                                isRescanDisabled={isRescanDisabled}
                                remainingRescans={remainingRescans}
                                maxRescans={MAX_AI_RESCAN_ATTEMPTS}
                            />
                        )}
                    </AnimatePresence>

                    {/* Footer */}
                    {!isFullWidth && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 text-center text-[10px] text-gray-300 dark:text-gray-600 tracking-wide font-semibold"
                        >
                            Millennia World School
                        </motion.p>
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
});

StudentFaceScanPage.displayName = "StudentFaceScanPage";
export default StudentFaceScanPage;
