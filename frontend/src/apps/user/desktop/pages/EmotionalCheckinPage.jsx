import React, { useState, memo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AnimatedPage from "@/components/AnimatedPage";
import { Helmet } from "react-helmet";
import {
    Smile,
    Sun,
    Cloud,
    CloudRain,
    Zap,
    HeartPulse,
    Sparkles,
    Frown,
    AlertCircle,
    Flame,
    Shield,
    Brain,
    Moon,
    Coffee,
    Tornado,
    Snowflake,
    Rainbow,
    CloudFog,
    Wind,
    Users,
    XCircle,
    Shuffle,
    Save,
    Send,
    Camera,
    CheckCircle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import checkinService from "@/services/checkinService";
import { prefetchStaffFaceScanOnIntent } from "@/utils/faceScanPrefetch";

/* --- Mood options --- */
const weatherOptions = [
    {
        icon: Sun,
        label: "Sunny & Clear",
        value: "sunny",
        gradient: "from-[var(--cw-sunny-from)] via-[var(--cw-sunny-via)] to-[var(--cw-sunny-to)]",
        iconTone: "text-amber-600 dark:text-amber-400",
    },
    {
        icon: Cloud,
        label: "Partly Cloudy",
        value: "partly-cloudy",
        gradient: "from-[var(--cw-partly-cloudy-from)] via-[var(--cw-partly-cloudy-via)] to-[var(--cw-partly-cloudy-to)]",
        iconTone: "text-slate-500",
    },
    {
        icon: CloudRain,
        label: "Light Rain",
        value: "light-rain",
        gradient: "from-[var(--cw-light-rain-from)] via-[var(--cw-light-rain-via)] to-[var(--cw-light-rain-to)]",
        iconTone: "text-sky-600",
    },
    {
        icon: Zap,
        label: "Thunderstorms",
        value: "thunderstorms",
        gradient: "from-[var(--cw-thunderstorms-from)] via-[var(--cw-thunderstorms-via)] to-[var(--cw-thunderstorms-to)]",
        iconTone: "text-orange-600",
    },
    {
        icon: Tornado,
        label: "Chaotic",
        value: "tornado",
        gradient: "from-[var(--cw-tornado-from)] via-[var(--cw-tornado-via)] to-[var(--cw-tornado-to)]",
        iconTone: "text-slate-600",
    },
    {
        icon: Snowflake,
        label: "Snowy & Still",
        value: "snowy",
        gradient: "from-[var(--cw-snowy-from)] via-[var(--cw-snowy-via)] to-[var(--cw-snowy-to)]",
        iconTone: "text-sky-600",
    },
    {
        icon: Rainbow,
        label: "Rainbow",
        value: "rainbow",
        gradient: "from-[var(--cw-rainbow-from)] via-[var(--cw-rainbow-via)] to-[var(--cw-rainbow-to)]",
        iconTone: "text-indigo-500",
    },
    {
        icon: CloudFog,
        label: "Foggy",
        value: "foggy",
        gradient: "from-[var(--cw-foggy-from)] via-[var(--cw-foggy-via)] to-[var(--cw-foggy-to)]",
        iconTone: "text-slate-500",
    },
    {
        icon: Flame,
        label: "Heatwave",
        value: "heatwave",
        gradient: "from-[var(--cw-heatwave-from)] via-[var(--cw-heatwave-via)] to-[var(--cw-heatwave-to)]",
        iconTone: "text-rose-500",
    },
    {
        icon: Wind,
        label: "Windy",
        value: "windy",
        gradient: "from-[var(--cw-windy-from)] via-[var(--cw-windy-via)] to-[var(--cw-windy-to)]",
        iconTone: "text-cyan-600",
    },
];

const moodOptions = [
    {
        icon: Smile,
        label: "Happy",
        value: "happy",
        gradient: "from-[var(--cm-happy-from)] via-[var(--cm-happy-via)] to-[var(--cm-happy-to)]",
        iconTone: "text-amber-700 dark:text-amber-400",
        tagline: "Bright energy",
    },
    {
        icon: Zap,
        label: "Excited",
        value: "excited",
        gradient: "from-[var(--cm-excited-from)] via-[var(--cm-excited-via)] to-[var(--cm-excited-to)]",
        iconTone: "text-rose-600",
        tagline: "Ready to shine",
    },
    {
        icon: HeartPulse,
        label: "Calm",
        value: "calm",
        gradient: "from-[var(--cm-calm-from)] via-[var(--cm-calm-via)] to-[var(--cm-calm-to)]",
        iconTone: "text-emerald-600",
        tagline: "Steady and grounded",
    },
    {
        icon: Sparkles,
        label: "Hopeful",
        value: "hopeful",
        gradient: "from-[var(--cm-hopeful-from)] via-[var(--cm-hopeful-via)] to-[var(--cm-hopeful-to)]",
        iconTone: "text-indigo-500",
        tagline: "Looking ahead",
    },
    {
        icon: Frown,
        label: "Sad",
        value: "sad",
        gradient: "from-[var(--cm-sad-from)] via-[var(--cm-sad-via)] to-[var(--cm-sad-to)]",
        iconTone: "text-blue-600",
        tagline: "Need a lift",
    },
    {
        icon: AlertCircle,
        label: "Anxious",
        value: "anxious",
        gradient: "from-[var(--cm-anxious-from)] via-[var(--cm-anxious-via)] to-[var(--cm-anxious-to)]",
        iconTone: "text-indigo-500",
        tagline: "A bit on edge",
    },
    {
        icon: Flame,
        label: "Angry",
        value: "angry",
        gradient: "from-[var(--cm-angry-from)] via-[var(--cm-angry-via)] to-[var(--cm-angry-to)]",
        iconTone: "text-rose-600",
        tagline: "Feeling intense",
    },
    {
        icon: Shield,
        label: "Fear",
        value: "fear",
        gradient: "from-[var(--cm-fear-from)] via-[var(--cm-fear-via)] to-[var(--cm-fear-to)]",
        iconTone: "text-slate-600",
        tagline: "Feeling uneasy",
    },
    {
        icon: Brain,
        label: "Overwhelmed",
        value: "overwhelmed",
        gradient: "from-[var(--cm-overwhelmed-from)] via-[var(--cm-overwhelmed-via)] to-[var(--cm-overwhelmed-to)]",
        iconTone: "text-violet-600",
        tagline: "Too much at once",
    },
    {
        icon: Moon,
        label: "Tired",
        value: "tired",
        gradient: "from-[var(--cm-tired-from)] via-[var(--cm-tired-via)] to-[var(--cm-tired-to)]",
        iconTone: "text-slate-600",
        tagline: "Low energy",
    },
    {
        icon: Coffee,
        label: "Hungry",
        value: "hungry",
        gradient: "from-[var(--cm-hungry-from)] via-[var(--cm-hungry-via)] to-[var(--cm-hungry-to)]",
        iconTone: "text-amber-700 dark:text-amber-400",
        tagline: "Need a boost",
    },
    {
        icon: Users,
        label: "Lonely",
        value: "lonely",
        gradient: "from-[var(--cm-lonely-from)] via-[var(--cm-lonely-via)] to-[var(--cm-lonely-to)]",
        iconTone: "text-sky-600",
        tagline: "Want connection",
    },
    {
        icon: XCircle,
        label: "Bored",
        value: "bored",
        gradient: "from-[var(--cm-bored-from)] via-[var(--cm-bored-via)] to-[var(--cm-bored-to)]",
        iconTone: "text-slate-500",
        tagline: "Low motivation",
    },
    {
        icon: Shuffle,
        label: "Scattered",
        value: "scattered",
        gradient: "from-[var(--cm-scattered-from)] via-[var(--cm-scattered-via)] to-[var(--cm-scattered-to)]",
        iconTone: "text-indigo-500",
        tagline: "Hard to focus",
    },
];

const moodGroups = [
    {
        key: "positive",
        title: "Positive",
        tone: "from-amber-400 to-emerald-400",
        moods: ["happy", "excited", "calm", "hopeful"],
    },
    {
        key: "challenging",
        title: "Challenging",
        tone: "from-rose-500 to-orange-400",
        moods: ["sad", "anxious", "angry", "fear", "overwhelmed"],
    },
    {
        key: "neutral",
        title: "Physical & Neutral",
        tone: "from-slate-400 to-slate-300",
        moods: ["tired", "hungry", "lonely", "bored", "scattered"],
    },
];

/* --- Decorative Blob --- */
const DecorativeBlob = memo(({ className, animate }) => (
    <motion.div
        className={`absolute rounded-full blur-3xl ${className}`}
        animate={animate ? {
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
        } : {}}
        transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
        }}
    />
));

/* --- Sanitize input --- */
const sanitizeInput = (value) => {
    return String(value || "")
        .replace(/<[^>]*>?/gm, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/(script|onerror|onload|data:|vbscript:)/gi, "")
        .trim()
        .slice(0, 500);
};

const EmotionalCheckinPage = memo(function EmotionalCheckinPage() {
    const [selectedWeather, setSelectedWeather] = useState(null);
    const [selectedMoods, setSelectedMoods] = useState([]);
    const [reflection, setReflection] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkinStatus, setCheckinStatus] = useState(null);
    const [activeMode, setActiveMode] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Load check-in status on component mount
    useEffect(() => {
        const loadCheckinStatus = async () => {
            try {
                const response = await checkinService.getTodayCheckinStatus();
                setCheckinStatus(response.data.status);
            } catch (error) {
                console.error('Failed to load check-in status:', error);
                toast({
                    title: "Error",
                    description: "Failed to load check-in status. Please refresh the page.",
                    variant: "destructive"
                });
            } finally {
                setIsLoadingStatus(false);
            }
        };

        loadCheckinStatus();
    }, [toast]);

    const handleSubmit = async () => {
        if (!selectedWeather || selectedMoods.length === 0) return;

        setIsSubmitting(true);
        try {
            // Submit manual check-in
            const checkinData = {
                weatherType: selectedWeather,
                selectedMoods,
                details: reflection,
                presenceLevel: 7, // Default values for manual check-in
                capacityLevel: 7,
                supportContactUserId: null,
                // Add flag to trigger notifications
                needsSupport: false // Manual check-in doesn't automatically trigger support notifications
            };

            const response = await checkinService.submitCheckin(checkinData);
            const checkinId = response.data.data.checkin.id;

            toast({
                title: "Check-in Submitted Successfully!",
                description: "Thank you for sharing your feelings. Your well-being matters to us.",
            });

            // Navigate to rating page after successful submission
            setTimeout(() => {
                console.log('Navigating to rating page after manual check-in submission:', checkinId);
                navigate(`/emotional-checkin/rate/${checkinId}`);
            }, 2000);

            // Reset form
            setSelectedWeather(null);
            setSelectedMoods([]);
            setReflection("");

        } catch (error) {
            console.error('Check-in submission failed:', error);
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Please try again. If the problem persists, contact support.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatedPage>
            <Helmet>
                <title>Student Emotional Check-in — Kerjain</title>
            </Helmet>

            <div className="mtss-theme mtss-animated-bg min-h-screen relative overflow-hidden text-foreground dark:text-white">
                <DecorativeBlob className="-top-48 -left-40 w-[28rem] h-[28rem] bg-pink-200/40" animate />
                <DecorativeBlob className="-bottom-52 -right-48 w-[26rem] h-[26rem] bg-sky-200/50" animate />
                <DecorativeBlob className="top-1/3 right-1/4 w-56 h-56 bg-emerald-200/40" animate />
                <div className="absolute inset-0 pointer-events-none">
                    <div className="mtss-hero-aurora absolute inset-0" />
                    <div className="mtss-hero-pulse absolute -top-20 left-10 w-[22rem] h-[22rem]" />
                    <div className="mtss-hero-orbit absolute bottom-10 right-16 w-40 h-40" />
                    <div className="absolute inset-0 bg-grid-small opacity-10 dark:opacity-10" />
                </div>

                <div className="container-tight px-4 py-10 relative z-10">
                    <div className="mx-auto max-w-5xl space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mtss-hero-panel relative overflow-hidden p-6 sm:p-8"
                        >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="space-y-3">
                                    <span className="mtss-rainbow-chip mtss-rainbow-chip--soft text-[11px]">
                                        Daily Check-in
                                    </span>
                                    <h1 className="text-3xl sm:text-4xl font-black mtss-gradient-text mtss-heading-rainbow">
                                        How are you feeling today?
                                    </h1>
                                    <p className="text-sm text-muted-foreground max-w-xl">
                                        Share a quick mood and reflection so we can celebrate your wins and support your day.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {isLoadingStatus ? (
                            <div className="mtss-rainbow-shell px-5 py-4 text-sm text-muted-foreground">
                                Checking today's check-in status...
                            </div>
                        ) : (
                            checkinStatus && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                    className="mtss-rainbow-shell p-4 grid sm:grid-cols-2 gap-3"
                                >
                                    <div
                                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${checkinStatus.hasManualCheckin
                                            ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300"
                                            : "bg-white/70 dark:bg-white/10 border-white/70 dark:border-white/10 text-muted-foreground"
                                            }`}
                                    >
                                        {checkinStatus.hasManualCheckin ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.2em]">Manual Check-in</div>
                                            <div className="text-sm font-medium">
                                                {checkinStatus.hasManualCheckin ? "Completed" : "Ready to start"}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${checkinStatus.hasAICheckin
                                            ? "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/70 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300"
                                            : "bg-white/70 dark:bg-white/10 border-white/70 dark:border-white/10 text-muted-foreground"
                                            }`}
                                    >
                                        {checkinStatus.hasAICheckin ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <XCircle className="w-4 h-4" />
                                        )}
                                        <div>
                                            <div className="text-xs font-semibold uppercase tracking-[0.2em]">AI Analysis</div>
                                            <div className="text-sm font-medium">
                                                {checkinStatus.hasAICheckin ? "Completed" : "Ready to scan"}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        )}

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.12 }}
                            className="mtss-rainbow-shell mtss-rainbow-shell--vivid p-5 sm:p-6"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Choose your check-in</p>
                                    <p className="text-sm text-muted-foreground">
                                        Pick one path for today. You can switch anytime.
                                    </p>
                                </div>
                                <span className="mtss-rainbow-chip mtss-rainbow-chip--soft text-[11px]">
                                    Choose One
                                </span>
                            </div>
                            <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setActiveMode("manual")}
                                    aria-pressed={activeMode === "manual"}
                                    className={`group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${activeMode === "manual"
                                        ? "border-transparent shadow-[0_20px_45px_rgba(255,88,194,0.25)]"
                                        : "border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:border-white"
                                        }`}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br from-[var(--checkin-btn-manual-from)] via-[var(--checkin-btn-manual-via)] to-[var(--checkin-btn-manual-to)] ${activeMode === "manual"
                                            ? "opacity-90"
                                            : "opacity-0 group-hover:opacity-70"
                                            } transition-opacity duration-300`}
                                    />
                                    <div className="relative z-10 flex items-start gap-3">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 text-rose-600">
                                            <Smile className="w-6 h-6" />
                                        </span>
                                        <div className="space-y-1">
                                            <p className={`text-sm font-semibold ${activeMode === "manual"
                                                ? "text-white"
                                                : "text-foreground dark:text-white"
                                                }`}>
                                                Manual Check-in
                                            </p>
                                            <p className={`text-xs ${activeMode === "manual"
                                                ? "text-white/80"
                                                : "text-muted-foreground"
                                                }`}>
                                                Select all emotions that resonate with you today.
                                            </p>
                                            <p className={`text-xs font-semibold ${activeMode === "manual"
                                                ? "text-white/80"
                                                : checkinStatus?.hasManualCheckin
                                                    ? "text-emerald-600"
                                                    : "text-muted-foreground"
                                                }`}>
                                                {checkinStatus?.hasManualCheckin ? "Completed today" : "Ready to start"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveMode("ai")}
                                    aria-pressed={activeMode === "ai"}
                                    className={`group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300 ${activeMode === "ai"
                                        ? "border-transparent shadow-[0_20px_45px_rgba(59,130,246,0.25)]"
                                        : "border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:border-white"
                                        }`}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br from-[var(--checkin-btn-ai-from)] via-[var(--checkin-btn-ai-via)] to-[var(--checkin-btn-ai-to)] ${activeMode === "ai"
                                            ? "opacity-90"
                                            : "opacity-0 group-hover:opacity-70"
                                            } transition-opacity duration-300`}
                                    />
                                    <div className="relative z-10 flex items-start gap-3">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 text-sky-600">
                                            <Brain className="w-6 h-6" />
                                        </span>
                                        <div className="space-y-1">
                                            <p className={`text-sm font-semibold ${activeMode === "ai"
                                                ? "text-white"
                                                : "text-foreground dark:text-white"
                                                }`}>
                                                AI Analysis
                                            </p>
                                            <p className={`text-xs ${activeMode === "ai"
                                                ? "text-white/80"
                                                : "text-muted-foreground"
                                                }`}>
                                                Camera scan + quick insight.
                                            </p>
                                            <p className={`text-xs font-semibold ${activeMode === "ai"
                                                ? "text-white/80"
                                                : checkinStatus?.hasAICheckin
                                                    ? "text-emerald-600"
                                                    : "text-muted-foreground"
                                                }`}>
                                                {checkinStatus?.hasAICheckin ? "Completed today" : "Ready to scan"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </motion.div>

                        <div className="space-y-6">
                            {!activeMode && (
                                <div className="mtss-rainbow-shell px-5 py-4 text-sm text-muted-foreground">
                                    Select one check-in option to get started.
                                </div>
                            )}
                            {activeMode === "manual" && (
                                <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.15 }}
                                className="mtss-rainbow-shell p-6 sm:p-7 space-y-5 border border-white/70 dark:border-white/10 max-w-4xl mx-auto"
                                >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Manual Check-in</p>
                                        <h2 className="text-xl font-bold text-foreground dark:text-white">How Are You Feeling?</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Select all emotions that resonate with you today
                                        </p>
                                    </div>
                                    <span
                                        className={`mtss-rainbow-chip text-[11px] ${checkinStatus?.hasManualCheckin
                                            ? "mtss-rainbow-chip--emerald"
                                            : "mtss-rainbow-chip--soft"
                                            }`}
                                    >
                                        {checkinStatus?.hasManualCheckin ? "Completed" : "Ready"}
                                    </span>
                                </div>

                                <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 p-4 sm:p-5 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                            Internal Weather Report
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            How are you feeling internally right now?
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                        {weatherOptions.map((weather) => {
                                            const Icon = weather.icon;
                                            const isSelected = selectedWeather === weather.value;
                                            return (
                                                <motion.button
                                                    key={weather.value}
                                                    whileTap={{ scale: 0.97 }}
                                                    whileHover={{ y: -2 }}
                                                    onClick={() => setSelectedWeather(weather.value)}
                                                    aria-pressed={isSelected}
                                                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isSelected
                                                        ? "border-transparent shadow-[0_18px_45px_rgba(125,211,252,0.35)]"
                                                        : "border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:border-white"
                                                        }`}
                                                >
                                                    <div
                                                        className={`absolute inset-0 bg-gradient-to-br ${weather.gradient} ${isSelected
                                                            ? "opacity-90"
                                                            : "opacity-0 group-hover:opacity-70"
                                                            } transition-opacity duration-300`}
                                                    />
                                                    <div className="relative z-10 flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
                                                        <span
                                                            className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 shadow-sm ${weather.iconTone}`}
                                                        >
                                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                        </span>
                                                        <div className="text-left">
                                                            <div
                                                                className={`text-sm font-semibold ${isSelected ? "text-white" : "text-foreground dark:text-white"
                                                                    }`}
                                                            >
                                                                {weather.label}
                                                            </div>
                                                            <div
                                                                className={`text-[11px] ${isSelected ? "text-white/80" : "text-muted-foreground hidden sm:block"
                                                                    }`}
                                                            >
                                                                {isSelected ? "Selected" : "Tap to choose"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                    {selectedWeather && (
                                        <p className="text-xs text-muted-foreground">
                                            Selected: {weatherOptions.find((weather) => weather.value === selectedWeather)?.label}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 p-4 sm:p-5 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Mood Check</p>
                                        <p className="text-sm text-muted-foreground">
                                            Select all emotions that resonate with you today
                                        </p>
                                    </div>
                                    <div className="space-y-4">
                                        {moodGroups.map((group) => (
                                            <div key={group.key} className="space-y-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <div className={`h-4 w-1 rounded-full bg-gradient-to-b ${group.tone}`} />
                                                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                                        {group.title}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {moodOptions
                                                        .filter((mood) => group.moods.includes(mood.value))
                                                        .map((mood) => {
                                                            const Icon = mood.icon;
                                                            const isSelected = selectedMoods.includes(mood.value);
                                                            return (
                                                                <motion.button
                                                                    key={mood.value}
                                                                    whileTap={{ scale: 0.97 }}
                                                                    whileHover={{ y: -2 }}
                                                                    onClick={() => {
                                                                        setSelectedMoods((prev) => prev.includes(mood.value)
                                                                            ? prev.filter((item) => item !== mood.value)
                                                                            : [...prev, mood.value]);
                                                                    }}
                                                                    aria-pressed={isSelected}
                                                                    className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isSelected
                                                                        ? "border-transparent shadow-[0_18px_45px_rgba(255,88,194,0.25)]"
                                                                        : "border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 hover:border-white"
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} ${isSelected
                                                                            ? "opacity-90"
                                                                            : "opacity-0 group-hover:opacity-70"
                                                                            } transition-opacity duration-300`}
                                                                    />
                                                                    <div className="relative z-10 flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4">
                                                                        <span
                                                                            className={`flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 shadow-sm ${mood.iconTone}`}
                                                                        >
                                                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                                        </span>
                                                                        <div>
                                                                            <div
                                                                                className={`text-sm font-semibold ${isSelected ? "text-white" : "text-foreground dark:text-white"
                                                                                    }`}
                                                                            >
                                                                                {mood.label}
                                                                            </div>
                                                                            <div
                                                                                className={`text-[11px] ${isSelected ? "text-white/80" : "text-muted-foreground hidden sm:block"
                                                                                    }`}
                                                                            >
                                                                                {mood.tagline}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </motion.button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-muted-foreground">
                                            <span>Share Your Thoughts</span>
                                            <span>{reflection.length}/500</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Tell us more about what you're experiencing (optional)
                                        </p>
                                    </div>
                                    <Textarea
                                        value={reflection}
                                        onChange={(e) => setReflection(sanitizeInput(e.target.value))}
                                        placeholder="What's on your mind today? Share your feelings, thoughts, or what's affecting you..."
                                        className="min-h-[120px] resize-none bg-white/80 dark:bg-white/10 border border-white/70 dark:border-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/30"
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Your responses are confidential and handled with care
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!selectedWeather || selectedMoods.length === 0 || isSubmitting || (checkinStatus && checkinStatus.hasManualCheckin)}
                                        className="w-full justify-center rounded-full bg-gradient-to-r from-[var(--checkin-btn-submit-from)] via-[var(--checkin-btn-submit-via)] to-[var(--checkin-btn-submit-to)] text-white font-semibold shadow-[0_18px_45px_rgba(255,88,194,0.25)] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? (
                                            <Save className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4 mr-2" />
                                        )}
                                        {isSubmitting
                                            ? "Submitting Your Check-in..."
                                            : checkinStatus?.hasManualCheckin
                                                ? "Check-in Completed"
                                                : "Submit Wellness Check-in"}
                                    </Button>
                                    {checkinStatus?.hasManualCheckin && (
                                        <p className="text-xs text-emerald-600 text-center font-medium">
                                            Manual check-in completed for today.
                                        </p>
                                    )}
                                </div>
                                </motion.section>
                            )}

                            {activeMode === "ai" && (
                                <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="mtss-rainbow-shell p-6 sm:p-7 space-y-5 border border-white/70 dark:border-white/10 max-w-4xl mx-auto"
                                >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">AI Analysis</p>
                                        <h2 className="text-xl font-bold text-foreground dark:text-white">Cheerful AI check-in</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Let the camera read your mood and give you a quick insight.
                                        </p>
                                    </div>
                                    <span
                                        className={`mtss-rainbow-chip text-[11px] ${checkinStatus?.hasAICheckin
                                            ? "mtss-rainbow-chip--emerald"
                                            : "mtss-rainbow-chip--soft"
                                            }`}
                                    >
                                        {checkinStatus?.hasAICheckin ? "Completed" : "Ready"}
                                    </span>
                                </div>

                                <div className="grid gap-3">
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-4 py-3">
                                        <div className="mtss-rainbow-chip mtss-rainbow-chip--icon">
                                            <Brain className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground dark:text-white">Emotion scan</p>
                                            <p className="text-xs text-muted-foreground">Instant mood snapshot in seconds.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/70 dark:border-white/10 bg-white/70 dark:bg-white/10 px-4 py-3">
                                        <div className="mtss-rainbow-chip mtss-rainbow-chip--icon">
                                            <Camera className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground dark:text-white">Friendly insights</p>
                                            <p className="text-xs text-muted-foreground">Personal tips to keep your day bright.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Button
                                        type="button"
                                        onMouseEnter={prefetchStaffFaceScanOnIntent}
                                        onFocus={prefetchStaffFaceScanOnIntent}
                                        onTouchStart={prefetchStaffFaceScanOnIntent}
                                        onClick={() => navigate('/emotional-checkin/face-scan')}
                                        disabled={checkinStatus && checkinStatus.hasAICheckin}
                                        className="w-full justify-center rounded-full bg-gradient-to-r from-[var(--checkin-btn-chat-from)] via-[var(--checkin-btn-chat-via)] to-[var(--checkin-btn-chat-to)] text-white font-semibold shadow-[0_18px_45px_rgba(59,130,246,0.25)] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <Brain className="w-4 h-4 mr-2" />
                                        <Camera className="w-4 h-4 mr-2" />
                                        {checkinStatus?.hasAICheckin ? "AI Analysis Completed" : "Start AI Emotional Analysis"}
                                    </Button>
                                    {checkinStatus?.hasAICheckin ? (
                                        <p className="text-xs text-emerald-600 text-center font-medium">
                                            AI analysis completed for today.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center">
                                            Use the camera for a quick, private check-in.
                                        </p>
                                    )}
                                </div>
                                </motion.section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
});

EmotionalCheckinPage.displayName = 'EmotionalCheckinPage';

export default EmotionalCheckinPage;
