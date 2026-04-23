import { memo, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
    Smile, Brain, Sparkles, ArrowLeft, ArrowRight,
    CheckCircle, XCircle, Star, Zap
} from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import checkinService from "@/services/checkinService";
import "@/pages/styles/student-ios-system.css";

/* ── CSS-only animations ── */
const ScopedStyles = memo(() => (
    <style>{`
        @keyframes secBgShift{
            0%{background-position:0% 0%}
            25%{background-position:50% 100%}
            50%{background-position:100% 50%}
            75%{background-position:50% 0%}
            100%{background-position:0% 0%}
        }
        .sec-bg{
            background-size:300% 300%;
            animation:secBgShift 16s ease infinite;
        }
        :is(.dark) .sec-bg{ animation:none; }

        .sec-grid{
            background-image:radial-gradient(circle,rgba(0,0,0,.04) 1px,transparent 1px);
            background-size:24px 24px;
        }
        :is(.dark) .sec-grid{
            background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px);
        }

        @keyframes secTextShimmer{
            0%{background-position:0% 50%}
            50%{background-position:100% 50%}
            100%{background-position:0% 50%}
        }
        .sec-title{
            font-family:'Nunito','Inter',system-ui,sans-serif;
            background-size:200% 200%;
            animation:secTextShimmer 4s ease infinite;
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
        }

        .sec-font{
            font-family:'Nunito','Inter',system-ui,-apple-system,sans-serif;
            letter-spacing:-0.01em;
        }

        @keyframes secBlob{
            0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}
            25%{transform:translate(12px,-8px) scale(1.04) rotate(1deg)}
            50%{transform:translate(-4px,10px) scale(.97) rotate(-1deg)}
            75%{transform:translate(-10px,-4px) scale(1.02) rotate(.5deg)}
        }

        @keyframes secFloat{
            0%,100%{transform:translateY(0) scale(1);opacity:.55}
            50%{transform:translateY(-10px) scale(1.12);opacity:.85}
        }
        @keyframes secSpin{
            from{transform:rotate(0deg)}to{transform:rotate(360deg)}
        }
        @keyframes secPulse{
            0%,100%{transform:scale(1);opacity:.4}
            50%{transform:scale(1.25);opacity:.7}
        }
        @keyframes secDrift{
            0%,100%{transform:translateX(0) translateY(0)}
            33%{transform:translateX(6px) translateY(-4px)}
            66%{transform:translateX(-4px) translateY(6px)}
        }

        .sec-card{
            transition:transform .3s cubic-bezier(.22,.68,0,1.1),box-shadow .3s ease;
        }
        .sec-card:active{transform:scale(.97)}
        @media(hover:hover){.sec-card:hover{transform:translateY(-4px)}}
    `}</style>
));
ScopedStyles.displayName = "ScopedStyles";

/* ── Particles ── */
const particles = [
    { t:'dot', top:'5%',  left:'5%',   sz:7,  cl:'bg-rose-300 dark:bg-rose-500/25',      anim:'secFloat', dur:4,   del:0 },
    { t:'dot', top:'12%', right:'8%',  sz:6,  cl:'bg-amber-300 dark:bg-amber-500/25',    anim:'secFloat', dur:5,   del:1 },
    { t:'dot', top:'35%', left:'3%',   sz:8,  cl:'bg-violet-300 dark:bg-violet-500/25',  anim:'secFloat', dur:4.5, del:0.5 },
    { t:'dot', top:'58%', right:'4%',  sz:5,  cl:'bg-sky-300 dark:bg-sky-500/25',        anim:'secFloat', dur:5.5, del:2 },
    { t:'dot', top:'78%', left:'8%',   sz:6,  cl:'bg-emerald-300 dark:bg-emerald-500/25',anim:'secFloat', dur:3.8, del:1.5 },
    { t:'dot', top:'90%', right:'12%', sz:7,  cl:'bg-orange-300 dark:bg-orange-500/25',  anim:'secFloat', dur:4.2, del:0.8 },
    { t:'ring', top:'8%',  left:'18%', sz:13, cl:'border-rose-300/50 dark:border-rose-500/20',    anim:'secPulse', dur:5,   del:0.3 },
    { t:'ring', top:'45%', right:'7%', sz:11, cl:'border-violet-300/50 dark:border-violet-500/20', anim:'secPulse', dur:6,   del:1.8 },
    { t:'ring', top:'82%', left:'6%',  sz:10, cl:'border-amber-300/50 dark:border-amber-500/20',  anim:'secPulse', dur:4.5, del:2.5 },
    { t:'cross', top:'20%', left:'4%',  sz:9,  cl:'bg-fuchsia-300/60 dark:bg-fuchsia-500/20', anim:'secSpin', dur:12, del:0 },
    { t:'cross', top:'62%', right:'5%', sz:8,  cl:'bg-emerald-300/60 dark:bg-emerald-500/20', anim:'secSpin', dur:15, del:2 },
    { t:'diamond', top:'15%', right:'16%', sz:7, cl:'bg-orange-300/50 dark:bg-orange-500/20', anim:'secDrift', dur:6,   del:1 },
    { t:'diamond', top:'68%', left:'15%',  sz:6, cl:'bg-sky-300/50 dark:bg-sky-500/20',      anim:'secDrift', dur:7,   del:2.5 },
    { t:'diamond', top:'50%', left:'20%',  sz:5, cl:'bg-rose-300/50 dark:bg-rose-500/20',    anim:'secDrift', dur:5.5, del:0.5 },
    { t:'diamond', top:'88%', right:'20%', sz:6, cl:'bg-violet-300/50 dark:bg-violet-500/20', anim:'secDrift', dur:6,  del:3 },
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

/* ── Card data ── */
const checkinOptions = [
    {
        id: "manual",
        title: "Manual Check-in",
        description: "Pick your weather, mood & energy level",
        icon: Smile,
        path: "/student/emotional-checkin/manual",
        tag: "Step-by-step",
        iconBg: "from-rose-400 to-orange-400",
        cardAccent: "from-rose-400/25 via-pink-300/15 to-transparent",
        tagStyle: "text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/15",
        iconShadow: "shadow-rose-400/30",
        statusKey: "hasManualCheckin",
    },
    {
        id: "ai",
        title: "AI Emotional Scan",
        description: "Camera reads your mood in seconds",
        icon: Brain,
        path: "/student/emotional-checkin/ai",
        tag: "Quick scan",
        iconBg: "from-sky-400 to-violet-500",
        cardAccent: "from-sky-400/25 via-blue-300/15 to-transparent",
        tagStyle: "text-sky-600 bg-sky-500/10 dark:text-sky-400 dark:bg-sky-500/15",
        iconShadow: "shadow-sky-400/30",
        statusKey: "hasAICheckin",
    },
];

const StudentEmotionalCheckinPage = memo(function StudentEmotionalCheckinPage() {
    const navigate = useNavigate();
    const [checkinStatus, setCheckinStatus] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const go = useCallback((p) => navigate(p), [navigate]);

    useEffect(() => {
        const loadCheckinStatus = async () => {
            try {
                const response = await checkinService.getTodayCheckinStatus();
                setCheckinStatus(response.data.status);
            } catch (error) {
                console.error('Failed to load check-in status:', error);
            } finally {
                setIsLoadingStatus(false);
            }
        };
        loadCheckinStatus();
    }, []);

    const manualCount = checkinStatus?.manualCount ?? (checkinStatus?.hasManualCheckin ? 1 : 0);
    const aiCount = checkinStatus?.aiCount ?? (checkinStatus?.hasAICheckin ? 1 : 0);
    const manualLimit = checkinStatus?.manualLimit ?? 1;
    const aiLimit = checkinStatus?.aiLimit ?? 1;
    const bothDone = checkinStatus?.hasManualCheckin && checkinStatus?.hasAICheckin;

    return (
        <AnimatedPage>
            <Helmet>
                <title>Student Emotional Check-in - Millennia World School</title>
            </Helmet>
            <ScopedStyles />

            <div
                className="sec-bg sec-font student-shell min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-50 via-pink-50 via-50% to-amber-50 dark:from-background dark:via-background dark:to-background"
                data-student-theme="emotion"
            >
                <div className="sec-grid absolute inset-0 pointer-events-none" />

                {/* Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-16 w-80 sm:w-[400px] h-80 sm:h-[400px] rounded-full blur-3xl bg-gradient-to-br from-pink-200/50 via-rose-200/35 to-fuchsia-100/25 dark:from-pink-500/8 dark:via-rose-500/4 dark:to-transparent" style={{ animation: 'secBlob 10s ease-in-out infinite' }} />
                    <div className="absolute -bottom-16 -left-16 w-72 sm:w-[370px] h-72 sm:h-[370px] rounded-full blur-3xl bg-gradient-to-br from-sky-200/50 via-blue-200/35 to-indigo-100/25 dark:from-sky-500/8 dark:via-blue-500/4 dark:to-transparent" style={{ animation: 'secBlob 12s ease-in-out infinite', animationDelay: '3s' }} />
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl bg-gradient-to-br from-violet-100/45 via-purple-100/25 to-transparent dark:from-violet-500/5 dark:to-transparent" style={{ animation: 'secBlob 9s ease-in-out infinite', animationDelay: '1.5s' }} />
                    <div className="absolute bottom-[15%] right-[5%] w-56 sm:w-68 h-56 sm:h-68 rounded-full blur-3xl bg-gradient-to-br from-amber-100/40 via-orange-100/25 to-transparent dark:from-amber-500/5 dark:to-transparent" style={{ animation: 'secBlob 11s ease-in-out infinite', animationDelay: '5s' }} />
                    <div className="absolute top-[8%] -left-10 w-48 sm:w-60 h-48 sm:h-60 rounded-full blur-3xl bg-gradient-to-br from-emerald-100/40 via-teal-100/20 to-transparent dark:from-emerald-500/5 dark:to-transparent" style={{ animation: 'secBlob 8s ease-in-out infinite', animationDelay: '2s' }} />
                    <div className="absolute top-[55%] -right-8 w-44 sm:w-56 h-44 sm:h-56 rounded-full blur-3xl bg-gradient-to-br from-rose-100/35 via-pink-100/20 to-transparent dark:from-rose-500/5 dark:to-transparent" style={{ animation: 'secBlob 13s ease-in-out infinite', animationDelay: '4s' }} />
                    {particles.map((p, i) => <Particle key={i} p={p} />)}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-10 pb-8 sm:pt-16 sm:pb-12 min-h-screen">

                    {/* Back */}
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/student/support-hub')}
                        className="self-start flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 font-semibold max-w-md w-full mx-auto"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back to Support Hub</span>
                    </motion.button>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="text-center mb-5 sm:mb-7 max-w-lg"
                    >
                        <div className="ios-pill inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-gray-200/40 dark:border-white/10 backdrop-blur-sm mb-4 shadow-sm">
                            <Sparkles className="w-3 h-3 text-pink-500" />
                            <span className="text-[11px] font-extrabold tracking-wide text-pink-600 dark:text-pink-400 uppercase">Emotional Check-in</span>
                        </div>

                        <h1 className="text-[1.65rem] sm:text-4xl font-black leading-tight mb-2">
                            <span className="sec-title bg-gradient-to-r from-pink-500 via-violet-500 via-40% to-sky-500 dark:from-pink-400 dark:via-violet-400 dark:to-sky-400">
                                How are you feeling today?
                            </span>
                        </h1>

                        <p className="text-[13px] sm:text-sm text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
                            Choose how you want to check in — tell us yourself or let AI help!
                        </p>
                    </motion.div>

                    {/* Status strip */}
                    {!isLoadingStatus && checkinStatus && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.35, delay: 0.1 }}
                            className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8"
                        >
                            <div className={`ios-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                                checkinStatus.hasManualCheckin
                                    ? "bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-700/30"
                                    : "bg-white/60 dark:bg-white/5 border-white/80 dark:border-white/10"
                            }`}>
                                {checkinStatus.hasManualCheckin ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
                                <span className={`text-[10px] font-bold ${checkinStatus.hasManualCheckin ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}>
                                    Manual {manualCount}/{manualLimit}
                                </span>
                            </div>
                            <div className={`ios-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                                checkinStatus.hasAICheckin
                                    ? "bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-700/30"
                                    : "bg-white/60 dark:bg-white/5 border-white/80 dark:border-white/10"
                            }`}>
                                {checkinStatus.hasAICheckin ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <XCircle className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />}
                                <span className={`text-[10px] font-bold ${checkinStatus.hasAICheckin ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`}>
                                    AI Scan {aiCount}/{aiLimit}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* All done banner */}
                    {bothDone && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="ios-glass-soft w-full max-w-md mb-5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-cyan-50/60 dark:from-emerald-900/15 dark:via-teal-900/10 dark:to-cyan-900/5 border border-emerald-200/50 dark:border-emerald-700/30 backdrop-blur-sm"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">All check-ins done for today!</p>
                                <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/50 font-medium">Great job! You can still revisit them if you want.</p>
                            </div>
                            <Star className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                        </motion.div>
                    )}

                    {/* Feature cards — navigate to dedicated pages */}
                    <div className="w-full max-w-md space-y-3 sm:space-y-4">
                        {checkinOptions.map((opt, i) => {
                            const Icon = opt.icon;
                            const isDone = checkinStatus?.[opt.statusKey];
                            return (
                                <motion.button
                                    key={opt.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                                    onClick={() => go(opt.path)}
                                    className="sec-card ios-glass ios-lift w-full relative overflow-hidden rounded-2xl sm:rounded-3xl text-left bg-white/65 dark:bg-white/[0.04] backdrop-blur-xl border border-white/90 dark:border-white/8 shadow-sm hover:shadow-xl p-4 sm:p-5 group"
                                >
                                    <div className={`absolute -top-10 -left-10 w-36 h-36 rounded-full bg-gradient-to-br ${opt.cardAccent} blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700`} />
                                    <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-tl ${opt.cardAccent} blur-2xl pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-500`} />

                                    <div className="relative z-10 flex items-center gap-3.5 sm:gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${opt.iconBg} flex items-center justify-center shadow-lg ${opt.iconShadow} group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h3 className="text-sm sm:text-base font-extrabold text-gray-800 dark:text-white truncate">{opt.title}</h3>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${opt.tagStyle}`}>{opt.tag}</span>
                                            </div>
                                            <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 leading-snug font-medium">{opt.description}</p>
                                            {isDone && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                                    <span className="text-[10px] font-bold text-emerald-500">
                                                        {opt.id === "manual" ? `${manualCount}/${manualLimit} completed` : `${aiCount}/${aiLimit} completed`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-50/80 dark:bg-white/8 flex items-center justify-center group-hover:bg-gray-100 dark:group-hover:bg-white/12 transition-all duration-200 group-hover:translate-x-0.5">
                                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors" />
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Daily tip */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45, duration: 0.35 }}
                        className="mt-8 sm:mt-10 w-full max-w-md"
                    >
                        <div className="ios-glass-soft flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-violet-50/80 via-purple-50/60 to-pink-50/40 dark:from-violet-900/10 dark:via-purple-900/5 dark:to-transparent border border-violet-100/60 dark:border-violet-800/20 backdrop-blur-sm">
                            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-extrabold text-violet-700/80 dark:text-violet-400/80">Quick tip</p>
                                <p className="text-[10px] text-violet-600/60 dark:text-violet-500/50 leading-snug font-medium">Try both check-ins today! Manual shares your perspective, AI adds another layer.</p>
                            </div>
                            <Star className="w-4 h-4 text-violet-300 flex-shrink-0" />
                        </div>
                    </motion.div>

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-6 text-[10px] text-gray-300 dark:text-gray-600 tracking-wide font-semibold"
                    >
                        Millennia World School
                    </motion.p>
                </div>
            </div>
        </AnimatedPage>
    );
});

StudentEmotionalCheckinPage.displayName = 'StudentEmotionalCheckinPage';

export default StudentEmotionalCheckinPage;
