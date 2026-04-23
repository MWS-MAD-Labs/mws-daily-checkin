import React, { memo, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles, HeartHandshake, RefreshCcw, CloudSun, ArrowUpRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import EmotionsDetected from "./results/EmotionsDetected";
import MicroExpressions from "./results/MicroExpressions";
import UserReflectionInput from "./results/UserReflectionInput";
import StudentSupportSelector from "@/components/emotion-student/StudentSupportSelector";

const moodColorSchemes = {
    happy: {
        pageBg: "from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950/20 dark:via-orange-950/10 dark:to-rose-950/20",
        blobA: "bg-gradient-to-br from-amber-300/35 via-orange-300/20 to-rose-300/15",
        blobB: "bg-gradient-to-br from-yellow-300/30 via-orange-300/15 to-transparent",
        hero: "from-amber-400 via-orange-400 to-rose-500",
        action: "from-amber-500 via-orange-500 to-rose-500",
        card: "from-amber-50/90 via-orange-50/80 to-rose-50/75 dark:from-amber-900/20 dark:via-orange-900/15 dark:to-rose-900/20",
        accent: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200/80 dark:border-orange-700/40",
        chip: "bg-orange-100/90 text-orange-700 border-orange-200/80 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700/40",
        confidenceFill: "from-amber-400 via-orange-400 to-rose-500",
        encouragement: "Your warm energy is showing. Keep sharing that positive spark.",
    },
    calm: {
        pageBg: "from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/20",
        blobA: "bg-gradient-to-br from-emerald-300/35 via-teal-300/20 to-cyan-300/15",
        blobB: "bg-gradient-to-br from-teal-300/28 via-cyan-300/14 to-transparent",
        hero: "from-emerald-400 via-teal-400 to-cyan-500",
        action: "from-emerald-500 via-teal-500 to-cyan-500",
        card: "from-emerald-50/90 via-teal-50/80 to-cyan-50/75 dark:from-emerald-900/20 dark:via-teal-900/15 dark:to-cyan-900/20",
        accent: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200/80 dark:border-emerald-700/40",
        chip: "bg-emerald-100/90 text-emerald-700 border-emerald-200/80 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700/40",
        confidenceFill: "from-emerald-400 via-teal-400 to-cyan-500",
        encouragement: "You are grounded and steady. That calm strength is a superpower.",
    },
    sad: {
        pageBg: "from-sky-50 via-blue-50 to-indigo-50 dark:from-sky-950/20 dark:via-blue-950/10 dark:to-indigo-950/20",
        blobA: "bg-gradient-to-br from-sky-300/35 via-blue-300/20 to-indigo-300/15",
        blobB: "bg-gradient-to-br from-blue-300/28 via-indigo-300/14 to-transparent",
        hero: "from-sky-400 via-blue-500 to-indigo-500",
        action: "from-sky-500 via-blue-500 to-indigo-500",
        card: "from-sky-50/90 via-blue-50/80 to-indigo-50/75 dark:from-sky-900/20 dark:via-blue-900/15 dark:to-indigo-900/20",
        accent: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200/80 dark:border-blue-700/40",
        chip: "bg-blue-100/90 text-blue-700 border-blue-200/80 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700/40",
        confidenceFill: "from-sky-400 via-blue-500 to-indigo-500",
        encouragement: "Gentle day, gentle pace. Small steps still mean progress.",
    },
    anxious: {
        pageBg: "from-violet-50 via-purple-50 to-indigo-50 dark:from-violet-950/20 dark:via-purple-950/10 dark:to-indigo-950/20",
        blobA: "bg-gradient-to-br from-violet-300/35 via-purple-300/20 to-indigo-300/15",
        blobB: "bg-gradient-to-br from-purple-300/28 via-indigo-300/14 to-transparent",
        hero: "from-violet-400 via-purple-500 to-indigo-500",
        action: "from-violet-500 via-purple-500 to-indigo-500",
        card: "from-violet-50/90 via-purple-50/80 to-indigo-50/75 dark:from-violet-900/20 dark:via-purple-900/15 dark:to-indigo-900/20",
        accent: "text-violet-700 dark:text-violet-300",
        border: "border-violet-200/80 dark:border-violet-700/40",
        chip: "bg-violet-100/90 text-violet-700 border-violet-200/80 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-700/40",
        confidenceFill: "from-violet-400 via-purple-500 to-indigo-500",
        encouragement: "You're handling a lot right now. Breathe and take one easy step at a time.",
    },
    angry: {
        pageBg: "from-rose-50 via-red-50 to-orange-50 dark:from-rose-950/20 dark:via-red-950/10 dark:to-orange-950/20",
        blobA: "bg-gradient-to-br from-rose-300/35 via-red-300/20 to-orange-300/15",
        blobB: "bg-gradient-to-br from-red-300/28 via-orange-300/14 to-transparent",
        hero: "from-rose-400 via-red-500 to-orange-500",
        action: "from-rose-500 via-red-500 to-orange-500",
        card: "from-rose-50/90 via-red-50/80 to-orange-50/75 dark:from-rose-900/20 dark:via-red-900/15 dark:to-orange-900/20",
        accent: "text-rose-700 dark:text-rose-300",
        border: "border-rose-200/80 dark:border-rose-700/40",
        chip: "bg-rose-100/90 text-rose-700 border-rose-200/80 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-700/40",
        confidenceFill: "from-rose-400 via-red-500 to-orange-500",
        encouragement: "Strong feelings are valid. You can channel this energy into healthy choices.",
    },
    neutral: {
        pageBg: "from-slate-50 via-zinc-50 to-gray-50 dark:from-slate-950/20 dark:via-zinc-950/10 dark:to-gray-950/20",
        blobA: "bg-gradient-to-br from-slate-300/30 via-zinc-300/18 to-gray-300/14",
        blobB: "bg-gradient-to-br from-zinc-300/25 via-gray-300/14 to-transparent",
        hero: "from-slate-400 via-zinc-500 to-gray-500",
        action: "from-slate-500 via-zinc-500 to-gray-500",
        card: "from-slate-50/90 via-zinc-50/80 to-gray-50/75 dark:from-slate-900/20 dark:via-zinc-900/15 dark:to-gray-900/20",
        accent: "text-slate-700 dark:text-slate-300",
        border: "border-slate-200/80 dark:border-slate-700/40",
        chip: "bg-slate-100/90 text-slate-700 border-slate-200/80 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-700/40",
        confidenceFill: "from-slate-400 via-zinc-500 to-gray-500",
        encouragement: "You're in a balanced zone. Keep listening to what your body needs.",
    },
    default: {
        pageBg: "from-fuchsia-50 via-violet-50 to-sky-50 dark:from-fuchsia-950/20 dark:via-violet-950/10 dark:to-sky-950/20",
        blobA: "bg-gradient-to-br from-fuchsia-300/35 via-violet-300/20 to-sky-300/15",
        blobB: "bg-gradient-to-br from-violet-300/28 via-sky-300/14 to-transparent",
        hero: "from-fuchsia-400 via-violet-500 to-sky-500",
        action: "from-fuchsia-500 via-violet-500 to-sky-500",
        card: "from-fuchsia-50/90 via-violet-50/80 to-sky-50/75 dark:from-fuchsia-900/20 dark:via-violet-900/15 dark:to-sky-900/20",
        accent: "text-violet-700 dark:text-violet-300",
        border: "border-violet-200/80 dark:border-violet-700/40",
        chip: "bg-violet-100/90 text-violet-700 border-violet-200/80 dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-700/40",
        confidenceFill: "from-fuchsia-400 via-violet-500 to-sky-500",
        encouragement: "You showed up for yourself today. That is already a big win.",
    }
};

const laneEncouragement = {
    thriving: "You are in a thriving rhythm today - keep the momentum going.",
    steady: "Nice stability today. Keep this balanced pace.",
    recovering: "Recovery is progress. Keep choosing gentle, helpful steps.",
    support: "Asking for support is brave and smart.",
    reset: "A reset day is still a growth day.",
};

const detectMoodKey = (analysis) => {
    const emotion = (analysis?.detectedEmotion || "").toLowerCase();
    const lane = (analysis?.readinessMatrix?.readinessLane || "").toLowerCase();

    if (emotion.includes("happ") || emotion.includes("joy") || emotion.includes("genuine")) return "happy";
    if (emotion.includes("calm") || emotion.includes("peace") || emotion.includes("serene")) return "calm";
    if (emotion.includes("sad") || emotion.includes("depress") || emotion.includes("suppress")) return "sad";
    if (emotion.includes("anxi") || emotion.includes("stress") || emotion.includes("worried")) return "anxious";
    if (emotion.includes("anger") || emotion.includes("angry") || emotion.includes("frustrat")) return "angry";
    if (emotion.includes("neutral") || emotion.includes("focused")) return "neutral";

    if (lane.includes("thriv") || lane.includes("energ")) return "happy";
    if (lane.includes("steady") || lane.includes("balance")) return "calm";
    if (lane.includes("recover") || lane.includes("rest")) return "sad";
    if (lane.includes("support") || lane.includes("overwhelm") || lane.includes("strain")) return "anxious";

    return "default";
};

const getReadinessFallback = (analysis) => ({
    presenceScore: analysis?.presenceCapacity?.estimatedPresence || 7,
    capacityScore: analysis?.presenceCapacity?.estimatedCapacity || 7,
    overallReadiness: Math.round(((analysis?.presenceCapacity?.estimatedPresence || 7) + (analysis?.presenceCapacity?.estimatedCapacity || 7)) / 2 * 10),
    readinessLane: "steady",
    signals: []
});

const normalizeLane = (lane) => {
    if (!lane) return "steady";
    return String(lane).toLowerCase();
};

const laneLabel = (lane) => {
    const normalized = normalizeLane(lane);
    return normalized
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(" ");
};

const clampPercent = (value, fallback = 70) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return fallback;
    return Math.max(0, Math.min(100, num));
};

const StudentResultsSection = memo(({
    analysis,
    onReset,
    onComplete,
    onSupportChange,
    onReflectionChange,
    isRescanDisabled = false,
    remainingRescans = 0,
    maxRescans = 2
}) => {
    const [hasReflection, setHasReflection] = useState(false);
    const [showNotification, setShowNotification] = useState(false);

    const rescanStatus = isRescanDisabled
        ? "Rescan quota exhausted."
        : `Remaining rescans: ${remainingRescans}/${maxRescans}`;

    const readiness = analysis?.readinessMatrix || getReadinessFallback(analysis);
    const moodKey = detectMoodKey(analysis);
    const colors = moodColorSchemes[moodKey] || moodColorSchemes.default;

    const storyline = analysis?.emotionalStoryline || {
        title: analysis?.detectedEmotion || "Mindful Awareness",
        chapter: analysis?.internalWeather || "Balanced Skies",
        narrative: analysis?.psychologicalInsight || "You're doing great! Keep checking in with yourself."
    };

    const heroDescription = analysis?.psychologicalInsight || storyline.narrative;
    const heroIcon = analysis?.icon;
    const confidence = clampPercent(analysis?.confidence, 70);

    const chips = analysis?.insightChips || [];
    const recommendations = (analysis?.detailedRecommendations || []).slice(0, 3);

    const lane = normalizeLane(readiness?.readinessLane);
    const laneText = laneLabel(lane);
    const encouragement = useMemo(() => {
        if (laneEncouragement[lane]) return laneEncouragement[lane];
        return colors.encouragement;
    }, [colors.encouragement, lane]);

    return (
        <section className="relative w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className={`pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br ${colors.pageBg}`} />
            <div className={`pointer-events-none absolute -top-14 -left-10 w-44 h-44 rounded-full blur-3xl ${colors.blobA}`} />
            <div className={`pointer-events-none absolute -bottom-16 -right-12 w-52 h-52 rounded-full blur-3xl ${colors.blobB}`} />

            <div className="relative z-10 space-y-4 sm:space-y-6">
                {/* Hero Section */}
                <div className={`rounded-3xl border ${colors.border} bg-white/75 dark:bg-background/45 backdrop-blur-xl p-4 sm:p-6 shadow-[0_16px_45px_-28px_rgba(0,0,0,0.45)]`}>
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 items-start">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 flex-1 w-full">
                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${colors.hero} flex items-center justify-center shadow-xl ring-2 ring-white/40 dark:ring-white/10`}>
                                {heroIcon ? (
                                    <span className="text-3xl sm:text-5xl">{heroIcon}</span>
                                ) : (
                                    <CloudSun className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                )}
                            </div>
                            <div className="flex-1 text-center sm:text-left w-full">
                                <p className={`text-xs font-semibold ${colors.accent} mb-1 flex items-center justify-center sm:justify-start gap-2`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {storyline.chapter}
                                </p>
                                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-2">
                                    {storyline.title}
                                </h1>
                                <p className="text-sm sm:text-base text-foreground/75 font-medium mb-2 leading-relaxed">
                                    {heroDescription}
                                </p>
                                <p className={`text-xs sm:text-sm font-semibold ${colors.accent} mb-3`}>
                                    {encouragement}
                                </p>

                                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mb-3">
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${colors.chip}`}>
                                        {confidence}% Confidence
                                    </span>
                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${colors.chip}`}>
                                        {laneText} Lane
                                    </span>
                                    {chips.slice(0, 3).map((chip, idx) => (
                                        <span key={`${chip.label}-${idx}`} className="px-2.5 py-1 text-xs font-bold rounded-full bg-white/80 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-white/60 dark:border-white/15">
                                            {chip.label}
                                        </span>
                                    ))}
                                </div>

                                <div className="w-full sm:max-w-sm">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/70 mb-1.5">
                                        <span>Confidence meter</span>
                                        <span>{confidence}%</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-white/65 dark:bg-black/25 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${confidence}%` }}
                                            transition={{ duration: 0.7, ease: "easeOut" }}
                                            className={`h-full rounded-full bg-gradient-to-r ${colors.confidenceFill}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Readiness Score */}
                        <div className={`w-full lg:w-56 bg-gradient-to-br ${colors.action} rounded-2xl p-4 sm:p-5 text-white shadow-xl`}>
                            <p className="text-xs font-semibold opacity-90 mb-1">Overall Readiness</p>
                            <p className="text-4xl sm:text-5xl font-black mb-1">{readiness.overallReadiness}%</p>
                            <p className="text-xs opacity-85 leading-snug">{laneText} mode</p>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${colors.card} border ${colors.border} rounded-xl p-3 sm:p-4 shadow-sm`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Presence</p>
                        <p className="text-xl sm:text-2xl font-black text-foreground">{readiness.presenceScore}/10</p>
                    </div>
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${colors.card} border ${colors.border} rounded-xl p-3 sm:p-4 shadow-sm`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Capacity</p>
                        <p className="text-xl sm:text-2xl font-black text-foreground">{readiness.capacityScore}/10</p>
                    </div>
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${colors.card} border ${colors.border} rounded-xl p-3 sm:p-4 shadow-sm`}>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Lane</p>
                        <p className="text-xl sm:text-2xl font-black text-foreground">{laneText}</p>
                    </div>
                </div>

                {/* Emotions & Micro Expressions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <EmotionsDetected emotions={analysis?.selfreportedEmotions || []} />
                    <MicroExpressions expressions={analysis?.microExpressions || []} />
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                    <div className={`backdrop-blur-xl bg-gradient-to-br ${colors.card} border ${colors.border} rounded-2xl p-4 sm:p-5 shadow-sm`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className={`w-4 h-4 ${colors.accent}`} />
                            <h3 className="text-sm font-bold text-foreground">Tips For You</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            {recommendations.map((rec, idx) => (
                                <div key={idx} className="bg-white/70 dark:bg-white/8 border border-white/50 dark:border-white/10 rounded-xl p-3">
                                    <p className="text-xs font-bold text-foreground mb-1">{rec.title}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{rec.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Support & Reflection */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <HeartHandshake className={`w-5 h-5 ${colors.accent}`} />
                        <h2 className="text-lg sm:text-xl font-bold text-foreground">Support & Reflection</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <StudentSupportSelector
                            supportContact={analysis?.selectedSupportContact || ""}
                            onSupportChange={(contact) => onSupportChange?.(contact)}
                        />
                        <UserReflectionInput
                            onReflectionChange={onReflectionChange}
                            onValidationChange={setHasReflection}
                        />
                    </div>
                </div>

                {/* Notification */}
                <AnimatePresence>
                    {showNotification && !hasReflection && (
                        <motion.div
                            initial={{ opacity: 0, y: -15, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -15, scale: 0.97 }}
                            transition={{ duration: 0.25 }}
                            className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-rose-900/30 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-4 shadow-lg"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 to-orange-300 dark:from-amber-700 dark:to-orange-700 flex items-center justify-center">
                                    <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-200" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-0.5">
                                        Don't forget to share your thoughts!
                                    </p>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                        Your reflection helps us understand your experience better. Please take a moment to share what triggered this feeling.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Action Center */}
                <div className={`bg-gradient-to-br ${colors.action} rounded-2xl p-5 sm:p-7 text-white shadow-xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-semibold opacity-90 mb-0.5">ACTION CENTER</p>
                            <h2 className="text-xl sm:text-2xl font-black">Finalize Session</h2>
                        </div>
                        <ArrowUpRight className="w-6 h-6 opacity-50" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <button
                            onClick={isRescanDisabled ? undefined : onReset}
                            disabled={isRescanDisabled}
                            className={cn(
                                "py-3.5 sm:py-4 rounded-xl text-sm font-bold transition-all duration-300",
                                isRescanDisabled
                                    ? "cursor-not-allowed opacity-40 bg-white/20 text-white/50"
                                    : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 active:scale-95"
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <RefreshCcw className="w-4 h-4" />
                                <span>Scan Again</span>
                            </div>
                        </button>

                        <button
                            onClick={() => {
                                if (!hasReflection) {
                                    setShowNotification(true);
                                    setTimeout(() => setShowNotification(false), 5000);
                                    return;
                                }
                                const duration = 3000;
                                const end = Date.now() + duration;
                                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
                                const rand = (min, max) => Math.random() * (max - min) + min;
                                const interval = setInterval(() => {
                                    if (Date.now() > end) return clearInterval(interval);
                                    const count = 50 * ((end - Date.now()) / duration);
                                    confetti({ ...defaults, particleCount: count, origin: { x: rand(0.1, 0.3), y: Math.random() - 0.2 } });
                                    confetti({ ...defaults, particleCount: count, origin: { x: rand(0.7, 0.9), y: Math.random() - 0.2 } });
                                }, 250);
                                onComplete();
                            }}
                            disabled={analysis?.isSubmitting}
                            className={cn(
                                "py-3.5 sm:py-4 rounded-xl text-sm font-bold transition-all duration-300",
                                analysis?.isSubmitting
                                    ? "bg-white/40 cursor-wait"
                                    : !hasReflection
                                    ? "bg-white/50 text-white/70 cursor-not-allowed"
                                    : "bg-white text-gray-800 hover:bg-white/95 active:scale-95"
                            )}
                        >
                            {analysis?.isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <span>Complete Session</span>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-center text-white/70">{rescanStatus}</p>
                </div>
            </div>
        </section>
    );
});

StudentResultsSection.displayName = "StudentResultsSection";

export default StudentResultsSection;
