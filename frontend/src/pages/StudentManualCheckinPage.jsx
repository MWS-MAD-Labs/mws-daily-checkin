import { useState, memo, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
    Smile, Sun, Cloud, CloudRain, Zap, HeartPulse, Sparkles, Frown,
    AlertCircle, Flame, Shield, Brain, Moon, Coffee, Tornado, Snowflake,
    Rainbow, CloudFog, Wind, Users, XCircle, Shuffle, Save, Send,
    ArrowLeft, ArrowRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import AnimatedPage from "@/components/AnimatedPage";
import { useToast } from "@/components/ui/use-toast";
import checkinService from "@/services/checkinService";
import StudentSupportSelector from "@/components/emotion-student/StudentSupportSelector";
import "@/pages/styles/student-ios-system.css";

/* ── Data ── */
const weatherOptions = [
    { icon: Sun, label: "Sunny & Clear", value: "sunny", gradient: "from-[#fde68a] via-[#fbbf24] to-[#f59e0b]", iconTone: "text-amber-600" },
    { icon: Cloud, label: "Partly Cloudy", value: "partly-cloudy", gradient: "from-[#e2e8f0] via-[#cbd5f5] to-[#94a3b8]", iconTone: "text-slate-500" },
    { icon: CloudRain, label: "Light Rain", value: "light-rain", gradient: "from-[#bfdbfe] via-[#93c5fd] to-[#38bdf8]", iconTone: "text-sky-600" },
    { icon: Zap, label: "Thunderstorms", value: "thunderstorms", gradient: "from-[#fca5a5] via-[#f97316] to-[#fbbf24]", iconTone: "text-orange-600" },
    { icon: Tornado, label: "Chaotic", value: "tornado", gradient: "from-[#e5e7eb] via-[#cbd5f5] to-[#94a3b8]", iconTone: "text-slate-600" },
    { icon: Snowflake, label: "Snowy & Still", value: "snowy", gradient: "from-[#e0f2fe] via-[#bfdbfe] to-[#93c5fd]", iconTone: "text-sky-600" },
    { icon: Rainbow, label: "Rainbow", value: "rainbow", gradient: "from-[#fbcfe8] via-[#a78bfa] to-[#6ee7b7]", iconTone: "text-indigo-500" },
    { icon: CloudFog, label: "Foggy", value: "foggy", gradient: "from-[#e2e8f0] via-[#c7d2fe] to-[#d1d5db]", iconTone: "text-slate-500" },
    { icon: Flame, label: "Heatwave", value: "heatwave", gradient: "from-[#fecaca] via-[#fb7185] to-[#f97316]", iconTone: "text-rose-500" },
    { icon: Wind, label: "Windy", value: "windy", gradient: "from-[#bae6fd] via-[#7dd3fc] to-[#22d3ee]", iconTone: "text-cyan-600" },
];

const moodOptions = [
    { icon: Smile, label: "Happy", value: "happy", gradient: "from-[#fde68a] via-[#fbbf24] to-[#fb7185]", iconTone: "text-amber-700", tagline: "Bright energy" },
    { icon: Zap, label: "Excited", value: "excited", gradient: "from-[#fbcfe8] via-[#f472b6] to-[#a855f7]", iconTone: "text-rose-600", tagline: "Ready to shine" },
    { icon: HeartPulse, label: "Calm", value: "calm", gradient: "from-[#bbf7d0] via-[#6ee7b7] to-[#34d399]", iconTone: "text-emerald-600", tagline: "Steady and grounded" },
    { icon: Sparkles, label: "Hopeful", value: "hopeful", gradient: "from-[#bae6fd] via-[#a78bfa] to-[#fbcfe8]", iconTone: "text-indigo-500", tagline: "Looking ahead" },
    { icon: Frown, label: "Sad", value: "sad", gradient: "from-[#bfdbfe] via-[#818cf8] to-[#38bdf8]", iconTone: "text-blue-600", tagline: "Need a lift" },
    { icon: AlertCircle, label: "Anxious", value: "anxious", gradient: "from-[#ddd6fe] via-[#a5b4fc] to-[#93c5fd]", iconTone: "text-indigo-500", tagline: "A bit on edge" },
    { icon: Flame, label: "Angry", value: "angry", gradient: "from-[#fecaca] via-[#f87171] to-[#fb7185]", iconTone: "text-rose-600", tagline: "Feeling intense" },
    { icon: Shield, label: "Fear", value: "fear", gradient: "from-[#e2e8f0] via-[#c4b5fd] to-[#a5b4fc]", iconTone: "text-slate-600", tagline: "Feeling uneasy" },
    { icon: Brain, label: "Overwhelmed", value: "overwhelmed", gradient: "from-[#fecdd3] via-[#c4b5fd] to-[#93c5fd]", iconTone: "text-violet-600", tagline: "Too much at once" },
    { icon: Moon, label: "Tired", value: "tired", gradient: "from-[#e2e8f0] via-[#cbd5f5] to-[#a5b4fc]", iconTone: "text-slate-600", tagline: "Low energy" },
    { icon: Coffee, label: "Hungry", value: "hungry", gradient: "from-[#fde68a] via-[#fcd34d] to-[#f59e0b]", iconTone: "text-amber-700", tagline: "Need a boost" },
    { icon: Users, label: "Lonely", value: "lonely", gradient: "from-[#e0f2fe] via-[#c4b5fd] to-[#e9d5ff]", iconTone: "text-sky-600", tagline: "Want connection" },
    { icon: XCircle, label: "Bored", value: "bored", gradient: "from-[#e5e7eb] via-[#cbd5f5] to-[#d1d5db]", iconTone: "text-slate-500", tagline: "Low motivation" },
    { icon: Shuffle, label: "Scattered", value: "scattered", gradient: "from-[#c7d2fe] via-[#a5b4fc] to-[#fbcfe8]", iconTone: "text-indigo-500", tagline: "Hard to focus" },
];

const moodGroups = [
    { key: "positive", title: "Positive", tone: "from-amber-400 to-emerald-400", moods: ["happy", "excited", "calm", "hopeful"] },
    { key: "challenging", title: "Challenging", tone: "from-rose-500 to-orange-400", moods: ["sad", "anxious", "angry", "fear", "overwhelmed"] },
    { key: "neutral", title: "Physical & Neutral", tone: "from-slate-400 to-slate-300", moods: ["tired", "hungry", "lonely", "bored", "scattered"] },
];

/* Presence & Capacity emoji levels — 5 levels mapped to 1-10 scale */
const presenceLevels = [
    { value: 2,  emoji: "😴", label: "Barely here",       color: "from-slate-300 to-slate-400",   ring: "ring-slate-300" },
    { value: 4,  emoji: "😶", label: "Kind of here",      color: "from-blue-300 to-blue-400",     ring: "ring-blue-300" },
    { value: 6,  emoji: "🙂", label: "Present",           color: "from-amber-300 to-amber-400",   ring: "ring-amber-300" },
    { value: 8,  emoji: "😊", label: "Focused",           color: "from-emerald-300 to-emerald-400", ring: "ring-emerald-300" },
    { value: 10, emoji: "🤩", label: "Fully here!",       color: "from-rose-400 to-pink-500",     ring: "ring-rose-400" },
];

const capacityLevels = [
    { value: 2,  emoji: "🪫", label: "Running on empty",  color: "from-slate-300 to-slate-400",   ring: "ring-slate-300" },
    { value: 4,  emoji: "🔋", label: "Low battery",       color: "from-orange-300 to-orange-400", ring: "ring-orange-300" },
    { value: 6,  emoji: "⚡", label: "Half charged",      color: "from-amber-300 to-amber-400",   ring: "ring-amber-300" },
    { value: 8,  emoji: "💪", label: "Feeling strong",    color: "from-emerald-300 to-emerald-400", ring: "ring-emerald-300" },
    { value: 10, emoji: "🚀", label: "Fully charged!",    color: "from-violet-400 to-purple-500", ring: "ring-violet-400" },
];

const sanitizeInput = (value) => {
    return String(value || "")
        .replace(/<[^>]*>?/gm, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/(script|onerror|onload|data:|vbscript:)/gi, "")
        .slice(0, 500);
};

/* Steps for the wizard */
const STEPS = [
    { id: "weather", title: "Internal Weather", subtitle: "How does your day feel inside?" },
    { id: "mood",    title: "Mood Check",       subtitle: "Pick all emotions that fit today" },
    { id: "energy",  title: "Energy Levels",    subtitle: "How present and charged are you?" },
    { id: "reflect", title: "Your Thoughts",    subtitle: "Anything else on your mind?" },
];

/* ── CSS-only animations ── */
const ScopedStyles = memo(() => (
    <style>{`
        @keyframes smcBgShift{
            0%{background-position:0% 0%}
            25%{background-position:50% 100%}
            50%{background-position:100% 50%}
            75%{background-position:50% 0%}
            100%{background-position:0% 0%}
        }
        .smc-bg{
            background-size:300% 300%;
            animation:smcBgShift 16s ease infinite;
        }
        :is(.dark) .smc-bg{ animation:none; }

        .smc-grid{
            background-image:radial-gradient(circle,rgba(0,0,0,.04) 1px,transparent 1px);
            background-size:24px 24px;
        }
        :is(.dark) .smc-grid{
            background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px);
        }

        @keyframes smcTextShimmer{
            0%{background-position:0% 50%}
            50%{background-position:100% 50%}
            100%{background-position:0% 50%}
        }
        .smc-title{
            font-family:'Nunito','Inter',system-ui,sans-serif;
            background-size:200% 200%;
            animation:smcTextShimmer 4s ease infinite;
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
        }

        .smc-font{
            font-family:'Nunito','Inter',system-ui,-apple-system,sans-serif;
            letter-spacing:-0.01em;
        }

        @keyframes smcBlob{
            0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}
            25%{transform:translate(12px,-8px) scale(1.04) rotate(1deg)}
            50%{transform:translate(-4px,10px) scale(.97) rotate(-1deg)}
            75%{transform:translate(-10px,-4px) scale(1.02) rotate(.5deg)}
        }

        @keyframes smcFloat{
            0%,100%{transform:translateY(0) scale(1);opacity:.55}
            50%{transform:translateY(-10px) scale(1.12);opacity:.85}
        }
        @keyframes smcPulse{
            0%,100%{transform:scale(1);opacity:.4}
            50%{transform:scale(1.25);opacity:.7}
        }
        @keyframes smcSpin{
            from{transform:rotate(0deg)}to{transform:rotate(360deg)}
        }
        @keyframes smcDrift{
            0%,100%{transform:translateX(0) translateY(0)}
            33%{transform:translateX(6px) translateY(-4px)}
            66%{transform:translateX(-4px) translateY(6px)}
        }

        .smc-card{
            transition:transform .3s cubic-bezier(.22,.68,0,1.1),box-shadow .3s ease;
        }
        .smc-card:active{transform:scale(.97)}
        @media(hover:hover){.smc-card:hover{transform:translateY(-2px)}}

        @keyframes smcBounce{
            0%,100%{transform:scale(1)}
            50%{transform:scale(1.15)}
        }
    `}</style>
));
ScopedStyles.displayName = "ScopedStyles";

/* ── Particles ── */
const particles = [
    { t:'dot', top:'5%',  left:'5%',   sz:7,  cl:'bg-rose-300 dark:bg-rose-500/25',      anim:'smcFloat', dur:4,   del:0 },
    { t:'dot', top:'12%', right:'8%',  sz:6,  cl:'bg-amber-300 dark:bg-amber-500/25',    anim:'smcFloat', dur:5,   del:1 },
    { t:'dot', top:'40%', left:'3%',   sz:8,  cl:'bg-violet-300 dark:bg-violet-500/25',  anim:'smcFloat', dur:4.5, del:0.5 },
    { t:'dot', top:'65%', right:'4%',  sz:5,  cl:'bg-sky-300 dark:bg-sky-500/25',        anim:'smcFloat', dur:5.5, del:2 },
    { t:'dot', top:'85%', left:'8%',   sz:6,  cl:'bg-emerald-300 dark:bg-emerald-500/25',anim:'smcFloat', dur:3.8, del:1.5 },
    { t:'ring', top:'8%',  left:'18%', sz:13, cl:'border-rose-300/50 dark:border-rose-500/20',    anim:'smcPulse', dur:5,   del:0.3 },
    { t:'ring', top:'50%', right:'7%', sz:11, cl:'border-violet-300/50 dark:border-violet-500/20', anim:'smcPulse', dur:6,   del:1.8 },
    { t:'cross', top:'22%', left:'4%',  sz:9,  cl:'bg-fuchsia-300/60 dark:bg-fuchsia-500/20', anim:'smcSpin', dur:12, del:0 },
    { t:'cross', top:'70%', right:'5%', sz:8,  cl:'bg-emerald-300/60 dark:bg-emerald-500/20', anim:'smcSpin', dur:15, del:2 },
    { t:'diamond', top:'15%', right:'16%', sz:7, cl:'bg-orange-300/50 dark:bg-orange-500/20', anim:'smcDrift', dur:6,   del:1 },
    { t:'diamond', top:'55%', left:'15%',  sz:6, cl:'bg-sky-300/50 dark:bg-sky-500/20',      anim:'smcDrift', dur:7,   del:2.5 },
    { t:'diamond', top:'90%', right:'20%', sz:6, cl:'bg-violet-300/50 dark:bg-violet-500/20', anim:'smcDrift', dur:6,  del:3 },
];

const Particle = memo(({ p }) => {
    const pos = { top: p.top, bottom: p.bottom, left: p.left, right: p.right };
    const base = 'absolute pointer-events-none';
    const anim = { animation: `${p.anim} ${p.dur}s ease-in-out infinite`, animationDelay: `${p.del}s` };
    if (p.t === 'ring') return <div className={`${base} rounded-full border-[1.5px] ${p.cl}`} style={{ ...pos, width: p.sz, height: p.sz, ...anim }} />;
    if (p.t === 'cross') return (
        <div className={base} style={{ ...pos, width: p.sz, height: p.sz, ...anim }}>
            <div className={`absolute top-1/2 left-0 w-full h-[1.5px] -translate-y-1/2 rounded-full ${p.cl}`} />
            <div className={`absolute left-1/2 top-0 h-full w-[1.5px] -translate-x-1/2 rounded-full ${p.cl}`} />
        </div>
    );
    if (p.t === 'diamond') return <div className={`${base} ${p.cl} rounded-[1px]`} style={{ ...pos, width: p.sz, height: p.sz, transform: 'rotate(45deg)', ...anim }} />;
    return <div className={`${base} rounded-full ${p.cl}`} style={{ ...pos, width: p.sz, height: p.sz, ...anim }} />;
});
Particle.displayName = "Particle";

/* ── Emoji Energy Meter component ── */
const EmojiEnergyMeter = memo(({ levels, value, onChange, label }) => (
    <div className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-extrabold">{label}</p>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
            {levels.map((level, i) => {
                const isSelected = value === level.value;
                const isPast = value >= level.value;
                return (
                    <motion.button
                        key={level.value}
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onChange(level.value)}
                        className={`smc-card relative flex flex-col items-center gap-1 rounded-2xl border px-2.5 py-2.5 sm:px-4 sm:py-3 transition-all duration-300 ${
                            isSelected
                                ? `border-transparent shadow-lg ring-2 ${level.ring}`
                                : isPast
                                    ? "border-white/80 dark:border-white/15 bg-white/50 dark:bg-white/8"
                                    : "border-white/50 dark:border-white/10 bg-white/30 dark:bg-white/5"
                        }`}
                    >
                        {isSelected && (
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${level.color} opacity-20`} />
                        )}
                        <motion.span
                            className="text-2xl sm:text-3xl select-none relative z-10"
                            animate={isSelected ? { scale: [1, 1.15, 1] } : {}}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        >
                            {level.emoji}
                        </motion.span>
                        <span className={`text-[9px] sm:text-[10px] font-bold relative z-10 text-center leading-tight ${
                            isSelected ? "text-gray-700 dark:text-white" : isPast ? "text-gray-500 dark:text-gray-400" : "text-gray-400 dark:text-gray-500"
                        }`}>
                            {level.label}
                        </span>
                        {/* Progress dots under selected */}
                        <div className="flex gap-0.5 mt-0.5">
                            {levels.slice(0, i + 1).map((_, di) => (
                                <div
                                    key={di}
                                    className={`w-1 h-1 rounded-full transition-colors duration-200 ${
                                        isPast ? `bg-gradient-to-r ${level.color.replace('from-', 'bg-')}` : "bg-gray-200 dark:bg-gray-700"
                                    }`}
                                    style={isPast ? { background: 'currentColor', opacity: 0.5 + (di / levels.length) * 0.5 } : {}}
                                />
                            ))}
                        </div>
                    </motion.button>
                );
            })}
        </div>
        {/* Selected label */}
        <AnimatePresence mode="wait">
            {value && (
                <motion.p
                    key={value}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="text-center text-xs font-bold text-gray-500 dark:text-gray-400"
                >
                    {levels.find(l => l.value === value)?.label}
                </motion.p>
            )}
        </AnimatePresence>
    </div>
));
EmojiEnergyMeter.displayName = "EmojiEnergyMeter";

/* ── Step progress bar ── */
const StepProgress = memo(({ current, steps }) => (
    <div className="flex items-center gap-1.5 w-full max-w-xs mx-auto">
        {steps.map((step, i) => (
            <div key={step.id} className="flex-1 flex items-center gap-1.5">
                <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                    i < current ? "bg-gradient-to-r from-pink-400 to-violet-400" :
                    i === current ? "bg-gradient-to-r from-pink-300 to-violet-300 animate-pulse" :
                    "bg-gray-200 dark:bg-gray-700"
                }`} />
            </div>
        ))}
    </div>
));
StepProgress.displayName = "StepProgress";

/* ── Main page ── */
const StudentManualCheckinPage = memo(function StudentManualCheckinPage() {
    const [step, setStep] = useState(0);
    const [selectedWeather, setSelectedWeather] = useState(null);
    const [selectedMoods, setSelectedMoods] = useState([]);
    const [presenceLevel, setPresenceLevel] = useState(null);
    const [capacityLevel, setCapacityLevel] = useState(null);
    const [reflection, setReflection] = useState("");
    const [supportContact, setSupportContact] = useState("No Need");
    const [supportContactId, setSupportContactId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlreadyDone, setIsAlreadyDone] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();

    // Get support contacts from Redux to map name to ID
    const { contacts: supportContacts } = useSelector((state) => state.support);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await checkinService.getTodayCheckinStatus();
                if (response.data.status?.hasManualCheckin) {
                    setIsAlreadyDone(true);
                }
            } catch (e) {
                // ignore
            }
        };
        checkStatus();
    }, []);

    const canGoNext = useCallback(() => {
        if (step === 0) return !!selectedWeather;
        if (step === 1) return selectedMoods.length > 0;
        if (step === 2) return presenceLevel !== null && capacityLevel !== null;
        return reflection.trim().length > 0; // reflection is required
    }, [step, selectedWeather, selectedMoods, presenceLevel, capacityLevel, reflection]);

    const handleNext = useCallback(() => {
        if (step < STEPS.length - 1 && canGoNext()) setStep(s => s + 1);
    }, [step, canGoNext]);

    const handleBack = useCallback(() => {
        if (step > 0) setStep(s => s - 1);
    }, [step]);

    const handleSupportContactChange = useCallback((contactNameOrNoNeed) => {
        // Store the contact name for display
        setSupportContact(contactNameOrNoNeed);

        // Map name to ID for backend submission
        if (contactNameOrNoNeed === "No Need" || !contactNameOrNoNeed) {
            setSupportContactId(null);
        } else {
            // Find the contact ID from the Redux store
            const contact = supportContacts.find(c => c.name === contactNameOrNoNeed || c.id === contactNameOrNoNeed);
            if (contact && contact.id !== "no-need") {
                setSupportContactId(contact.id);
            } else {
                setSupportContactId(null);
            }
        }
    }, [supportContacts]);

    const handleSubmit = useCallback(async () => {
        if (!selectedWeather || selectedMoods.length === 0 || reflection.trim().length === 0) {
            toast({
                title: "Thoughts Required",
                description: "Please share your thoughts before submitting.",
                variant: "destructive",
            });
            return;
        }
        setIsSubmitting(true);
        try {
            const checkinData = {
                weatherType: selectedWeather,
                selectedMoods,
                details: reflection.trim(),
                presenceLevel: presenceLevel || 7,
                capacityLevel: capacityLevel || 7,
                supportContactUserId: supportContactId || null,
                needsSupport: Boolean(supportContactId)
            };
            const response = await checkinService.submitCheckin(checkinData);
            const checkinId = response.data.data.checkin.id;
            toast({ title: "Check-in Submitted!", description: "Thanks for sharing how you feel today!" });
            setTimeout(() => navigate(`/emotional-checkin/rate/${checkinId}`), 2000);
        } catch (error) {
            toast({ title: "Submission Failed", description: error.response?.data?.message || "Please try again.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedWeather, selectedMoods, reflection, presenceLevel, capacityLevel, supportContactId, navigate, toast]);

    const slideVariants = {
        enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir < 0 ? 80 : -80, opacity: 0 }),
    };
    const [direction, setDirection] = useState(1);

    const goNext = useCallback(() => { setDirection(1); handleNext(); }, [handleNext]);
    const goBack = useCallback(() => { setDirection(-1); handleBack(); }, [handleBack]);

    return (
        <AnimatedPage>
            <Helmet><title>Manual Check-in - Millennia World School</title></Helmet>
            <ScopedStyles />

            <div
                className="smc-bg smc-font student-shell min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-50 via-amber-50 via-50% to-sky-50 dark:from-background dark:via-background dark:to-background"
                data-student-theme="manual"
            >
                <div className="smc-grid absolute inset-0 pointer-events-none" />

                {/* Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-16 w-80 sm:w-[400px] h-80 sm:h-[400px] rounded-full blur-3xl bg-gradient-to-br from-rose-200/50 via-pink-200/35 to-fuchsia-100/25 dark:from-rose-500/8 dark:via-pink-500/4 dark:to-transparent" style={{ animation: 'smcBlob 10s ease-in-out infinite' }} />
                    <div className="absolute -bottom-16 -left-16 w-72 sm:w-[370px] h-72 sm:h-[370px] rounded-full blur-3xl bg-gradient-to-br from-sky-200/50 via-blue-200/35 to-indigo-100/25 dark:from-sky-500/8 dark:via-blue-500/4 dark:to-transparent" style={{ animation: 'smcBlob 12s ease-in-out infinite', animationDelay: '3s' }} />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl bg-gradient-to-br from-amber-100/45 via-yellow-100/25 to-transparent dark:from-amber-500/5 dark:to-transparent" style={{ animation: 'smcBlob 9s ease-in-out infinite', animationDelay: '1.5s' }} />
                    <div className="absolute bottom-[10%] right-[5%] w-56 sm:w-68 h-56 sm:h-68 rounded-full blur-3xl bg-gradient-to-br from-emerald-100/40 via-teal-100/25 to-transparent dark:from-emerald-500/5 dark:to-transparent" style={{ animation: 'smcBlob 11s ease-in-out infinite', animationDelay: '5s' }} />
                    <div className="absolute top-[8%] -left-10 w-48 sm:w-60 h-48 sm:h-60 rounded-full blur-3xl bg-gradient-to-br from-violet-100/40 via-purple-100/20 to-transparent dark:from-violet-500/5 dark:to-transparent" style={{ animation: 'smcBlob 8s ease-in-out infinite', animationDelay: '2s' }} />
                    {particles.map((p, i) => <Particle key={i} p={p} />)}
                </div>

                {/* Content */}
                <div className="relative z-10 px-4 py-6 sm:py-10 max-w-2xl mx-auto">

                    {/* Back */}
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/student/emotional-checkin')}
                        className="ios-pill flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-5 font-semibold px-3 py-1.5 w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </motion.button>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="text-center mb-5"
                    >
                        <div className="ios-pill inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-gray-200/40 dark:border-white/10 backdrop-blur-sm mb-3 shadow-sm">
                            <Sparkles className="w-3 h-3 text-pink-500" />
                            <span className="text-[10px] font-extrabold tracking-widest text-pink-600 dark:text-pink-400 uppercase">Manual Check-in</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black leading-tight mb-1">
                            <span className="smc-title bg-gradient-to-r from-pink-500 via-amber-500 via-40% to-violet-500 dark:from-pink-400 dark:via-amber-400 dark:to-violet-400">
                                {STEPS[step].title}
                            </span>
                        </h1>
                        <p className="text-[13px] text-gray-400 dark:text-gray-500 font-medium">
                            {STEPS[step].subtitle}
                        </p>
                    </motion.div>

                    {/* Step progress */}
                    <div className="mb-6">
                        <StepProgress current={step} steps={STEPS} />
                        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-2">
                            Step {step + 1} of {STEPS.length}
                        </p>
                    </div>

                    {/* Already done notice */}
                    {isAlreadyDone && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="ios-glass-soft backdrop-blur-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-200/50 dark:border-emerald-700/40 rounded-2xl p-4 mb-5 flex items-center gap-3"
                        >
                            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">You've already completed your manual check-in today!</p>
                        </motion.div>
                    )}

                    {/* Step content */}
                    <div className="ios-glass-strong backdrop-blur-xl bg-white/55 dark:bg-white/5 border border-white/70 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm min-h-[280px]">
                        <AnimatePresence mode="wait" custom={direction}>
                            {/* Step 0: Weather */}
                            {step === 0 && (
                                <motion.div
                                    key="weather"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-400" />
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-extrabold">Internal Weather Report</p>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                        {weatherOptions.map((weather) => {
                                            const Icon = weather.icon;
                                            const isSelected = selectedWeather === weather.value;
                                            return (
                                                <motion.button
                                                    key={weather.value}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedWeather(weather.value)}
                                                    className={`smc-card group relative overflow-hidden rounded-xl border transition-all duration-300 ${isSelected ? "border-transparent shadow-lg" : "border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-white/90 hover:shadow-md"}`}
                                                >
                                                    <div className={`absolute inset-0 bg-gradient-to-br ${weather.gradient} ${isSelected ? "opacity-85" : "opacity-0 group-hover:opacity-40"} transition-opacity duration-300`} />
                                                    <div className="relative z-10 flex items-center gap-2 px-3 py-2.5">
                                                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${isSelected ? "bg-white/30" : "bg-white/70 dark:bg-white/10"} ${weather.iconTone} transition-colors duration-200`}>
                                                            <Icon className="w-4 h-4" />
                                                        </span>
                                                        <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>{weather.label}</span>
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 1: Moods */}
                            {step === 1 && (
                                <motion.div
                                    key="mood"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-4 w-1 rounded-full bg-gradient-to-b from-pink-400 to-violet-400" />
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-extrabold">Select all that apply</p>
                                    </div>
                                    {moodGroups.map((group) => (
                                        <div key={group.key} className="space-y-2">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className={`h-3.5 w-1 rounded-full bg-gradient-to-b ${group.tone}`} />
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">{group.title}</span>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                                {moodOptions.filter((mood) => group.moods.includes(mood.value)).map((mood) => {
                                                    const Icon = mood.icon;
                                                    const isSelected = selectedMoods.includes(mood.value);
                                                    return (
                                                        <motion.button
                                                            key={mood.value}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={() => setSelectedMoods((prev) => prev.includes(mood.value) ? prev.filter((v) => v !== mood.value) : [...prev, mood.value])}
                                                            className={`smc-card group relative overflow-hidden rounded-xl border transition-all duration-300 ${isSelected ? "border-transparent shadow-lg" : "border-white/60 dark:border-white/10 bg-white/40 dark:bg-white/5 hover:border-white/90 hover:shadow-md"}`}
                                                        >
                                                            <div className={`absolute inset-0 bg-gradient-to-br ${mood.gradient} ${isSelected ? "opacity-85" : "opacity-0 group-hover:opacity-40"} transition-opacity duration-300`} />
                                                            <div className="relative z-10 flex items-center gap-2 px-3 py-2.5">
                                                                <span className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${isSelected ? "bg-white/30" : "bg-white/70 dark:bg-white/10"} ${mood.iconTone} transition-colors duration-200`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </span>
                                                                <div>
                                                                    <p className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"}`}>{mood.label}</p>
                                                                    <p className={`text-[10px] hidden sm:block font-medium ${isSelected ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>{mood.tagline}</p>
                                                                </div>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Step 2: Energy (Presence + Capacity) */}
                            {step === 2 && (
                                <motion.div
                                    key="energy"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-6"
                                >
                                    <EmojiEnergyMeter
                                        levels={presenceLevels}
                                        value={presenceLevel}
                                        onChange={setPresenceLevel}
                                        label="How present do you feel right now?"
                                    />
                                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
                                    <EmojiEnergyMeter
                                        levels={capacityLevels}
                                        value={capacityLevel}
                                        onChange={setCapacityLevel}
                                        label="How much energy do you have today?"
                                    />
                                </motion.div>
                            )}

                            {/* Step 3: Reflection */}
                            {step === 3 && (
                                <motion.div
                                    key="reflect"
                                    custom={direction}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-1 rounded-full bg-gradient-to-b from-sky-400 to-indigo-400" />
                                            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-extrabold">Share Your Thoughts</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{reflection.length}/500</span>
                                    </div>
                                    <Textarea
                                        value={reflection}
                                        onChange={(e) => setReflection(sanitizeInput(e.target.value))}
                                        placeholder="What's on your mind today? (required)"
                                        className="min-h-[140px] resize-none bg-white/50 dark:bg-white/5 border border-white/70 dark:border-white/10 focus:border-pink-300 focus:ring-2 focus:ring-pink-200/50 rounded-xl text-sm backdrop-blur-sm"
                                        maxLength={500}
                                        required
                                    />
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                        This field is required — please write at least one meaningful sentence.
                                    </p>

                                    {/* Summary */}
                                    <div className="mt-4 p-3 rounded-xl bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 space-y-2">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-500 font-extrabold">Summary</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-500/15 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                                                {weatherOptions.find(w => w.value === selectedWeather)?.label || "—"}
                                            </span>
                                            {selectedMoods.map(m => (
                                                <span key={m} className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-100/80 dark:bg-pink-500/15 text-[10px] font-bold text-pink-700 dark:text-pink-400">
                                                    {moodOptions.find(mo => mo.value === m)?.label}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-3 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                                            <span>Presence: {presenceLevels.find(l => l.value === presenceLevel)?.emoji} {presenceLevels.find(l => l.value === presenceLevel)?.label}</span>
                                            <span>Energy: {capacityLevels.find(l => l.value === capacityLevel)?.emoji} {capacityLevels.find(l => l.value === capacityLevel)?.label}</span>
                                        </div>
                                    </div>

                                    {/* Support Contact Selector */}
                                    <div className="mt-4">
                                        <StudentSupportSelector
                                            supportContact={supportContact}
                                            onSupportChange={handleSupportContactChange}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center gap-3 mt-5">
                        {step > 0 && (
                            <Button
                                type="button"
                                onClick={goBack}
                                variant="outline"
                                className="rounded-xl border-white/70 dark:border-white/15 bg-white/50 dark:bg-white/5 font-bold backdrop-blur-sm hover:bg-white/70"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1.5" />
                                Back
                            </Button>
                        )}
                        <div className="flex-1" />
                        {step < STEPS.length - 1 ? (
                            <Button
                                type="button"
                                onClick={goNext}
                                disabled={!canGoNext()}
                                className="rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500 hover:from-pink-600 hover:via-rose-600 hover:to-violet-600 text-white font-extrabold shadow-lg shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                Next
                                <ArrowRight className="w-4 h-4 ml-1.5" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || isAlreadyDone || !canGoNext()}
                                className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            >
                                {isSubmitting ? <Save className="w-4 h-4 mr-1.5 animate-spin" /> : <Send className="w-4 h-4 mr-1.5" />}
                                {isSubmitting ? "Submitting..." : isAlreadyDone ? "Already Done" : "Submit"}
                            </Button>
                        )}
                    </div>

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-8 text-center text-[10px] text-gray-300 dark:text-gray-600 tracking-wide font-semibold"
                    >
                        Millennia World School
                    </motion.p>
                </div>
            </div>
        </AnimatedPage>
    );
});

StudentManualCheckinPage.displayName = 'StudentManualCheckinPage';

export default StudentManualCheckinPage;
