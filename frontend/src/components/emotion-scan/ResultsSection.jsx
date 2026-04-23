
import React, { memo, useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import confetti from "canvas-confetti";
import {
    Sparkles,
    Activity,
    HeartHandshake,
    RefreshCcw,
    Quote,
    Brain,
    Compass,
    Wind,
    CloudSun,
    CloudRain,
    Sun,
    Moon,
    ArrowUpRight,
    AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import EmotionsDetected from "./results/EmotionsDetected";
import MicroExpressions from "./results/MicroExpressions";
import UserReflectionInput from "./results/UserReflectionInput";
import SupportSelector from "@/components/emotion-staff/SupportSelector";

const defaultHints = {
    gradientCss: "linear-gradient(135deg, rgba(245,243,255,0.92) 0%, rgba(237,233,254,0.85) 52%, rgba(255,255,255,0.92) 100%)",
    glassColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(148, 163, 184, 0.35)",
    accentColor: "#8b5cf6",
    animationAnchor: "fade-up",
    badges: []
};

const colorTokens = {
    berry: "var(--mtss-pop-berry)",
    peach: "var(--mtss-pop-peach)",
    sky: "var(--mtss-pop-sky)",
    lime: "var(--mtss-pop-lime)",
    gold: "hsl(var(--gold))",
    emerald: "hsl(var(--emerald))",
    accent: "hsl(var(--accent))",
    secondary: "hsl(var(--secondary))",
    foreground: "hsl(var(--foreground))"
};
const moodTokenMap = {
    balanced: {
        heroGradient: `linear-gradient(135deg, ${colorTokens.sky}, ${colorTokens.lime})`,
        panelBg: "linear-gradient(160deg, rgba(255,255,255,0.9), rgba(240,248,255,0.78))",
        panelBorder: "rgba(148,187,233,0.45)",
        chipBg: `linear-gradient(120deg, ${colorTokens.sky}, ${colorTokens.lime})`,
        chipText: "#0f172a",
        track: "rgba(15,23,42,0.12)",
        presenceBar: `linear-gradient(90deg, ${colorTokens.lime}, ${colorTokens.emerald})`,
        capacityBar: `linear-gradient(90deg, ${colorTokens.sky}, ${colorTokens.peach})`,
        panelShadow: "0 28px 75px rgba(15,23,42,0.14)",
        icon: CloudSun
    },
    charged: {
        heroGradient: `linear-gradient(135deg, ${colorTokens.berry}, ${colorTokens.peach})`,
        panelBg: "linear-gradient(150deg, rgba(255,255,255,0.94), rgba(255,236,245,0.75))",
        panelBorder: "rgba(244,114,182,0.45)",
        chipBg: `linear-gradient(120deg, ${colorTokens.berry}, ${colorTokens.peach})`,
        chipText: "#3b0a19",
        track: "rgba(15,15,35,0.18)",
        presenceBar: `linear-gradient(90deg, ${colorTokens.peach}, ${colorTokens.gold})`,
        capacityBar: `linear-gradient(90deg, ${colorTokens.berry}, ${colorTokens.sky})`,
        panelShadow: "0 34px 90px rgba(244,114,182,0.22)",
        icon: Sun
    },
    calm: {
        heroGradient: `linear-gradient(135deg, ${colorTokens.sky}, ${colorTokens.secondary})`,
        panelBg: "linear-gradient(160deg, rgba(255,255,255,0.9), rgba(229,238,255,0.78))",
        panelBorder: "rgba(148,163,184,0.45)",
        chipBg: `linear-gradient(120deg, ${colorTokens.secondary}, ${colorTokens.sky})`,
        chipText: "#0f172a",
        track: "rgba(15,23,42,0.12)",
        presenceBar: `linear-gradient(90deg, ${colorTokens.secondary}, ${colorTokens.sky})`,
        capacityBar: `linear-gradient(90deg, ${colorTokens.sky}, ${colorTokens.lime})`,
        panelShadow: "0 28px 70px rgba(15,23,42,0.12)",
        icon: Moon
    },
    storm: {
        heroGradient: `linear-gradient(135deg, ${colorTokens.secondary}, ${colorTokens.berry})`,
        panelBg: "linear-gradient(165deg, rgba(23,24,40,0.9), rgba(50,18,61,0.75))",
        panelBorder: "rgba(148,163,184,0.35)",
        chipBg: `linear-gradient(120deg, ${colorTokens.secondary}, ${colorTokens.berry})`,
        chipText: "#f8fafc",
        track: "rgba(248,250,252,0.2)",
        presenceBar: `linear-gradient(90deg, ${colorTokens.secondary}, ${colorTokens.berry})`,
        capacityBar: `linear-gradient(90deg, ${colorTokens.berry}, ${colorTokens.peach})`,
        panelShadow: "0 40px 90px rgba(0,0,0,0.45)",
        icon: CloudRain
    },
    radiant: {
        heroGradient: `linear-gradient(135deg, ${colorTokens.peach}, ${colorTokens.gold})`,
        panelBg: "linear-gradient(150deg, rgba(255,255,255,0.95), rgba(255,245,227,0.82))",
        panelBorder: "rgba(250,204,21,0.4)",
        chipBg: `linear-gradient(120deg, ${colorTokens.gold}, ${colorTokens.peach})`,
        chipText: "#7c2d12",
        track: "rgba(15,23,42,0.08)",
        presenceBar: `linear-gradient(90deg, ${colorTokens.gold}, ${colorTokens.peach})`,
        capacityBar: `linear-gradient(90deg, ${colorTokens.peach}, ${colorTokens.sky})`,
        panelShadow: "0 34px 90px rgba(249,115,22,0.22)",
        icon: Sun
    }
};
const weatherMoodMap = {
    "balanced skies": "balanced",
    "steady skies": "balanced",
    "charged currents": "charged",
    stormwatch: "storm",
    "heavy clouds": "storm",
    "gentle tides": "calm",
    "soothing mist": "calm",
    "luminous dawn": "radiant",
    "glowing horizon": "radiant"
};

const emotionMoodMap = {
    joy: "radiant",
    joyful: "radiant",
    excited: "charged",
    energized: "charged",
    anxious: "storm",
    stressed: "storm",
    calm: "calm",
    serene: "calm",
    balanced: "balanced"
};

const laneDescriptions = {
    glide: "Your body and mind are in sync. Maintain focus without forgetting to take creative breaks.",
    steady: "Work rhythm is stable. Use structure to keep your flow step by step.",
    sensitive: "Your nervous system is sensitive. Avoid multitasking and choose short, tactical tasks.",
    repair: "Prioritize recovery. Practice breathing exercises and delegate non-urgent matters."
};
const narrativeArchetypes = {
    balancing: {
        heroTitle: "Balanced Emotional State",
        heroSubtitle: "Balanced Skies",
        description: "Your emotional awareness is evenly distributed. You're able to feel without being overwhelmed and respond without rushing.",
        energyDescription: "Lane {lane} indicates a reliable rhythm for closing strategic priorities.",
        somaticCue: "Perform a 60-second body scan before entering meetings to catch micro-tensions early.",
        weatherWatch: "If external triggers arise, take 4-4-6 breaths and expand your response window.",
        practiceTitle: "Micro Ritual",
        practice: "Take three 4-4-6 breath cycles between task transitions to maintain emotional consistency.",
        focus: "Equilibrium",
        attentionCue: "Maintain a gentle yet precise rhythm when switching contexts.",
        energyTemperature: "Neutral warm emotional temperature.",
        moodVector: "Equilibrium Arc"
    },
    expansion: {
        heroTitle: "Expansive Momentum",
        heroSubtitle: "Charged Currents",
        description: "There's abundant cognitive energy ready to be directed. The challenge is channeling it without overdoing.",
        energyDescription: "Lane {lane} signals progressive momentum, use it for big ideas.",
        somaticCue: "Ground your feet on the floor for 30 seconds to direct energy into your body before pitching.",
        weatherWatch: "Control overdrive impulses with 50/10 work intervals to maintain concentration.",
        practiceTitle: "Directional Burst",
        practice: "Write down two key goals and set micro-alarms to check progress every 90 minutes.",
        focus: "Momentum",
        attentionCue: "Channel excess energy into collaboration or brief mentoring.",
        energyTemperature: "High warm emotional temperature.",
        moodVector: "Expansion Route"
    },
    renewal: {
        heroTitle: "Restorative Window",
        heroSubtitle: "Gentle Tides",
        description: "Your body is requesting a gentler rhythm. Soft focus helps restore creative capacity.",
        energyDescription: "Lane {lane} invites you to reset boundaries so energy can recover.",
        somaticCue: "Flex your shoulders and jaw every 45 minutes to release micro-tensions.",
        weatherWatch: "Schedule a quiet break without notifications for at least 10 minutes before your next heavy session.",
        practiceTitle: "Nourish Break",
        practice: "Drink warm water and do brief journaling about body sensations before continuing work.",
        focus: "Restoration",
        attentionCue: "Insert light creative tasks to help your limbic system feel safe.",
        energyTemperature: "Cool soothing emotional temperature.",
        moodVector: "Renewal Path"
    },
    grounding: {
        heroTitle: "Grounded Repair",
        heroSubtitle: "Stormwatch",
        description: "There's minor emotional turbulence. A systematic approach will help you feel safe again.",
        energyDescription: "Lane {lane} means capacity needs to be refilled first.",
        somaticCue: "Press your palms together for 20 seconds to stabilize your nervous system.",
        weatherWatch: "Reduce screen exposure and limit complex decisions until your breath feels longer.",
        practiceTitle: "Stability Stack",
        practice: "Apply the 5-4-3-2-1 method to return focus to your body before responding to difficult messages.",
        focus: "Stability",
        attentionCue: "Seek co-regulation through a colleague or voice journaling.",
        energyTemperature: "Cool damp emotional temperature.",
        moodVector: "Grounding Line"
    }
};
const getMoodTokens = (analysis, hints) => {
    const weatherKey = (analysis?.internalWeather || "").toLowerCase();
    const emotionKey = (analysis?.detectedEmotion || "").toLowerCase();
    const laneKey = analysis?.readinessMatrix?.readinessLane;
    const derivedKey =
        weatherMoodMap[weatherKey] ||
        emotionMoodMap[emotionKey] ||
        (laneKey === "glide"
            ? "radiant"
            : laneKey === "repair"
                ? "storm"
                : laneKey === "sensitive"
                    ? "calm"
                    : "balanced");
    const tokens = moodTokenMap[derivedKey] || moodTokenMap.balanced;

    return {
        ...tokens,
        accent: tokens.accent || hints?.accentColor || defaultHints.accentColor
    };
};

const getPanelStyle = (hints, tokens) => ({
    borderColor: tokens?.panelBorder || hints?.borderColor || defaultHints.borderColor,
    background: tokens?.panelBg || hints?.gradientCss || defaultHints.gradientCss,
    color: "inherit",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    boxShadow: tokens?.panelShadow
});

const getReadinessFallback = (analysis) => {
    const presence = analysis?.presenceCapacity?.estimatedPresence || 6;
    const capacity = analysis?.presenceCapacity?.estimatedCapacity || 6;
    const overall = Math.round(((presence + capacity) / 20) * 100);
    return {
        presenceScore: presence,
        capacityScore: capacity,
        overallReadiness: overall,
        readinessLane: overall >= 80 ? "glide" : overall >= 60 ? "steady" : overall >= 40 ? "sensitive" : "repair",
        signals: [
            {
                label: "Presence",
                status: presence >= 7 ? "clear" : presence >= 5 ? "foggy" : "dense",
                idea: presence >= 7 ? "Use this clarity for strategic decisions." : "Create a 10-minute quiet buffer before important tasks."
            },
            {
                label: "Capacity",
                status: capacity >= 7 ? "charged" : capacity >= 5 ? "oscillating" : "drained",
                idea: capacity >= 6 ? "Channel surplus energy into collaboration." : "Pair intense blocks with brief reset rituals."
            }
        ]
    };
};

const buildFallbackNarrativeEngine = (analysis = {}, readiness = getReadinessFallback()) => {
    const lane = readiness.readinessLane || "steady";
    const hasStoryline = Boolean(analysis?.emotionalStoryline);
    const autoArc =
        analysis?.emotionalStoryline?.arc ||
        (lane === "repair"
            ? "grounding"
            : lane === "sensitive"
                ? "renewal"
                : readiness.capacityScore >= 7
                    ? "expansion"
                    : "balancing");
    const archetype = narrativeArchetypes[autoArc] || narrativeArchetypes.balancing;
    const storyline = hasStoryline
        ? analysis.emotionalStoryline
        : {
            title: analysis?.detectedEmotion || archetype.heroTitle,
            chapter: analysis?.internalWeather || archetype.heroSubtitle,
            narrative: analysis?.psychologicalInsight || archetype.description,
            arc: autoArc,
            confidence: analysis?.confidence ?? readiness.overallReadiness,
            colorTone: archetype.focus.toLowerCase()
        };

    const signalSource = analysis?.readinessMatrix?.signals?.length
        ? analysis.readinessMatrix.signals
        : readiness.signals;

    const recommendations = [
        ...signalSource.map((signal) => ({
            title: `${signal.label} - ${signal.status}`,
            description: signal.idea
        })),
        {
            title: archetype.practiceTitle,
            description: archetype.practice
        }
    ];

    const chips = [
        storyline.chapter,
        readiness.readinessLane,
        archetype.focus
    ]
        .filter(Boolean)
        .map((label) => ({ label }));

    const insights = [
        { label: "Lane Insight", detail: laneDescriptions[lane] || laneDescriptions.steady },
        { label: "Somatic Signal", detail: archetype.somaticCue },
        { label: "Momentum", detail: archetype.energyDescription.replace("{lane}", lane) }
    ];

    return {
        storyline,
        heroTitle: storyline.title,
        heroSubtitle: storyline.chapter,
        heroDescription: storyline.narrative,
        chips,
        insights,
        recommendations,
        laneDescriptor: laneDescriptions[lane] || laneDescriptions.steady,
        attentionCue: archetype.attentionCue,
        energyTemperature: archetype.energyTemperature,
        moodVector: archetype.moodVector
    };
};
const ResultsSection = memo(({
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

    useEffect(() => {
        // Disable AOS animations for better performance
        // AOS.init({
        //     once: true,
        //     duration: 650,
        //     easing: "ease-out-cubic"
        // });
    }, []);

    const rescanStatus = isRescanDisabled
        ? "Rescan quota for this feature has been exhausted."
        : `Remaining rescans: ${remainingRescans}/${maxRescans}`;

    const hints = analysis?.displayHints || defaultHints;
    const readiness = analysis?.readinessMatrix || getReadinessFallback(analysis);
    const moodTokens = getMoodTokens(analysis, hints);
    const fallbackEngine = buildFallbackNarrativeEngine(analysis, readiness);
    const storyline = analysis?.emotionalStoryline || {
        title: analysis?.detectedEmotion || "Mindful Awareness",
        chapter: analysis?.internalWeather || "Balanced Skies",
        narrative: analysis?.psychologicalInsight || "Continue this emotional check-in habit to maintain your daily balance.",
        arc: "balancing",
        confidence: analysis?.confidence || 70,
        colorTone: hints?.theme || "lilac"
    };
    const heroDescription = analysis?.psychologicalInsight || storyline.narrative || fallbackEngine.heroDescription;
    const supportCompass = analysis?.supportCompass || {
        needsSupport: readiness.overallReadiness < 55,
        supportLevel: readiness.overallReadiness < 55 ? "active" : "monitor",
        suggestedAllies: ["Peer ally", "Trusted mentor"],
        message: readiness.overallReadiness < 55
            ? "Consider reaching out to a support contact for co-regulation."
            : "Share your positive energy with colleagues today.",
        storylineContext: storyline.title
    };
    const heroStyle = {
        ...getPanelStyle(hints, moodTokens),
        backgroundImage: moodTokens.heroGradient,
        borderRadius: "28px",
        padding: "1px"
    };

    const chips = analysis?.insightChips?.length
        ? analysis.insightChips
        : fallbackEngine.chips;

    const recommendations = (analysis?.detailedRecommendations?.length ? analysis.detailedRecommendations : fallbackEngine.recommendations).slice(0, 4);

    const quickStats = [
        {
            label: "Confidence",
            value: `${analysis?.confidence ?? storyline.confidence ?? 70}%`,
            subtext: fallbackEngine.energyTemperature
        },
        {
            label: "Lane",
            value: readiness.readinessLane,
            subtext: fallbackEngine.laneDescriptor
        },
        {
            label: "Today's Focus",
            value: fallbackEngine.moodVector,
            subtext: fallbackEngine.attentionCue
        }
    ];

    const heroIconContent = analysis?.icon;
    const IconComponent = moodTokens.icon || CloudSun;
    return (
        <section className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-8">
            {/* Hero Section - Mobile Optimized */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
                {/* Main Title & Icon */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 flex-1 w-full">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700 flex items-center justify-center shadow-xl sm:shadow-2xl shadow-violet-500/30">
                        {heroIconContent ? (
                            typeof heroIconContent === "string" ? (
                                <span className="text-4xl sm:text-6xl">{heroIconContent}</span>
                            ) : (
                                heroIconContent
                            )
                        ) : (
                            <IconComponent className="w-10 h-10 sm:w-14 sm:h-14 text-white" />
                        )}
                    </div>
                    <div className="flex-1 text-center sm:text-left w-full">
                        <p className="text-xs sm:text-sm font-semibold text-violet-600 dark:text-violet-400 mb-1.5 sm:mb-2 flex items-center justify-center sm:justify-start gap-2">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-violet-600 dark:bg-violet-400"></span>
                            {storyline.chapter}
                        </p>
                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-foreground mb-2 sm:mb-3">
                            {storyline.title}
                        </h1>
                        <p className="text-sm sm:text-lg text-foreground/70 font-medium mb-3 sm:mb-4 leading-relaxed">
                            {heroDescription}
                        </p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                            <span className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                                {analysis?.confidence ?? storyline.confidence ?? 70}% Confidence
                            </span>
                            {chips.map((chip, idx) => (
                                <span key={`${chip.label}-${idx}`} className="px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    {chip.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Overall Readiness Card - Mobile Compact */}
                <div className="w-full lg:w-64 bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl sm:shadow-2xl shadow-emerald-500/30">
                    <p className="text-xs sm:text-sm font-semibold opacity-90 mb-1.5 sm:mb-2">Overall Readiness</p>
                    <p className="text-5xl sm:text-6xl font-black mb-2 sm:mb-3">{readiness.overallReadiness}%</p>
                    <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{fallbackEngine.attentionCue}</p>
                </div>
            </div>

            {/* Quick Stats - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {quickStats.map((stat, idx) => {
                    const colors = [
                        { bg: 'from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700', shadow: 'shadow-violet-500/30' },
                        { bg: 'from-blue-500 to-cyan-600 dark:from-blue-600 dark:to-cyan-700', shadow: 'shadow-blue-500/30' },
                        { bg: 'from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700', shadow: 'shadow-amber-500/30' }
                    ];
                    return (
                        <div key={stat.label} className={`bg-gradient-to-br ${colors[idx].bg} rounded-xl sm:rounded-2xl p-4 sm:p-5 text-white shadow-lg sm:shadow-xl ${colors[idx].shadow}`}>
                            <p className="text-xs font-bold opacity-90 mb-1.5 sm:mb-2 uppercase tracking-wide">{stat.label}</p>
                            <p className="text-2xl sm:text-3xl font-black mb-1.5 sm:mb-2 capitalize">{stat.value}</p>
                            <p className="text-xs sm:text-sm opacity-90 leading-snug">{stat.subtext}</p>
                        </div>
                    );
                })}
            </div>

            {/* Support Section - Mobile Optimized */}
            <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center gap-2 sm:gap-3">
                    <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">Support & Reflection</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Support Selector */}
                    <SupportSelector
                        supportContact={analysis?.selectedSupportContact || ""}
                        onSupportChange={(contact) => {
                            if (onSupportChange) {
                                onSupportChange(contact);
                            }
                        }}
                    />

                    {/* Reflection Input */}
                    <UserReflectionInput
                        onReflectionChange={onReflectionChange}
                        onValidationChange={setHasReflection}
                    />
                </div>
            </div>
            {/* Warm Notification for Empty Reflection */}
            <AnimatePresence>
                {showNotification && !hasReflection && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-amber-900/40 dark:via-orange-900/40 dark:to-rose-900/40 border-2 border-amber-300 dark:border-amber-600 rounded-2xl p-4 shadow-lg"
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-700 dark:to-orange-700 flex items-center justify-center border-2 border-amber-300 dark:border-amber-600">
                                <AlertCircle className="w-5 h-5 text-amber-700 dark:text-amber-200" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-1">
                                    💭 Don't forget to share your thoughts!
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                    Your reflection helps us understand your experience better and personalize future insights. Please take a moment to share what triggered this feeling.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Center - Mobile Optimized */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl sm:shadow-2xl shadow-emerald-500/30">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div>
                        <p className="text-xs sm:text-sm font-semibold opacity-90 mb-0.5 sm:mb-1">🎬 ACTION CENTER</p>
                        <h2 className="text-xl sm:text-3xl font-black">Finalize Session</h2>
                    </div>
                    <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 opacity-50" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <button
                        onClick={isRescanDisabled ? undefined : onReset}
                        disabled={isRescanDisabled}
                        className={cn(
                            "py-4 sm:py-5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all duration-300",
                            isRescanDisabled
                                ? "cursor-not-allowed opacity-40 bg-white/20 text-white/50"
                                : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/30 active:scale-95 sm:hover:scale-105"
                        )}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5" />
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

                            // Trigger confetti animation
                            const duration = 3000;
                            const animationEnd = Date.now() + duration;
                            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                            const randomInRange = (min, max) => Math.random() * (max - min) + min;

                            const interval = setInterval(() => {
                                const timeLeft = animationEnd - Date.now();

                                if (timeLeft <= 0) {
                                    return clearInterval(interval);
                                }

                                const particleCount = 50 * (timeLeft / duration);

                                confetti({
                                    ...defaults,
                                    particleCount,
                                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                                });
                                confetti({
                                    ...defaults,
                                    particleCount,
                                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                                });
                            }, 250);

                            onComplete();
                        }}
                        disabled={analysis?.isSubmitting}
                        className={cn(
                            "py-4 sm:py-5 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all duration-300",
                            analysis?.isSubmitting
                                ? "bg-white/40 cursor-wait"
                                : !hasReflection
                                ? "bg-white/50 text-emerald-600/70 cursor-not-allowed"
                                : "bg-white text-emerald-600 hover:bg-white/95 active:scale-95 sm:hover:scale-105"
                        )}
                    >
                        {analysis?.isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            <span>✅ Complete</span>
                        )}
                    </button>
                </div>

                <p className={cn("text-xs sm:text-sm text-center", isRescanDisabled ? "text-white/70" : "text-white/80")}>
                    {rescanStatus}
                </p>
            </div>
        </section>
    );
});

ResultsSection.displayName = "ResultsSection";
export default ResultsSection;
