import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Brain, Camera, Sparkles, ArrowLeft, Check, Shield, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedPage from "@/components/AnimatedPage";
import checkinService from "@/services/checkinService";
import { prefetchStudentFaceScanOnIntent } from "@/utils/faceScanPrefetch";
import "@/pages/styles/student-ios-system.css";

/* ── CSS-only animations ── */
const ScopedStyles = memo(() => (
    <style>{`
        @keyframes saiBgShift{
            0%{background-position:0% 0%}
            25%{background-position:50% 100%}
            50%{background-position:100% 50%}
            75%{background-position:50% 0%}
            100%{background-position:0% 0%}
        }
        .sai-bg{
            background-size:300% 300%;
            animation:saiBgShift 16s ease infinite;
        }
        :is(.dark) .sai-bg{ animation:none; }

        .sai-grid{
            background-image:radial-gradient(circle,rgba(0,0,0,.04) 1px,transparent 1px);
            background-size:24px 24px;
        }
        :is(.dark) .sai-grid{
            background-image:radial-gradient(circle,rgba(255,255,255,.035) 1px,transparent 1px);
        }

        @keyframes saiTextShimmer{
            0%{background-position:0% 50%}
            50%{background-position:100% 50%}
            100%{background-position:0% 50%}
        }
        .sai-title{
            font-family:'Nunito','Inter',system-ui,sans-serif;
            background-size:200% 200%;
            animation:saiTextShimmer 4s ease infinite;
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
        }

        .sai-font{
            font-family:'Nunito','Inter',system-ui,-apple-system,sans-serif;
            letter-spacing:-0.01em;
        }

        @keyframes saiBlob{
            0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}
            25%{transform:translate(12px,-8px) scale(1.04) rotate(1deg)}
            50%{transform:translate(-4px,10px) scale(.97) rotate(-1deg)}
            75%{transform:translate(-10px,-4px) scale(1.02) rotate(.5deg)}
        }

        @keyframes saiFloat{
            0%,100%{transform:translateY(0) scale(1);opacity:.55}
            50%{transform:translateY(-10px) scale(1.12);opacity:.85}
        }
        @keyframes saiPulse{
            0%,100%{transform:scale(1);opacity:.4}
            50%{transform:scale(1.25);opacity:.7}
        }
        @keyframes saiSpin{
            from{transform:rotate(0deg)}to{transform:rotate(360deg)}
        }
        @keyframes saiDrift{
            0%,100%{transform:translateX(0) translateY(0)}
            33%{transform:translateX(6px) translateY(-4px)}
            66%{transform:translateX(-4px) translateY(6px)}
        }
        @keyframes saiOrbit{
            from{transform:rotate(0deg) translateX(40px) rotate(0deg)}
            to{transform:rotate(360deg) translateX(40px) rotate(-360deg)}
        }
    `}</style>
));
ScopedStyles.displayName = "ScopedStyles";

/* ── Particles ── */
const particles = [
    { t:'dot', top:'6%',  left:'6%',   sz:7,  cl:'bg-sky-300 dark:bg-sky-500/25',        anim:'saiFloat', dur:4,   del:0 },
    { t:'dot', top:'14%', right:'8%',  sz:6,  cl:'bg-violet-300 dark:bg-violet-500/25',  anim:'saiFloat', dur:5,   del:1 },
    { t:'dot', top:'45%', left:'3%',   sz:8,  cl:'bg-blue-300 dark:bg-blue-500/25',      anim:'saiFloat', dur:4.5, del:0.5 },
    { t:'dot', top:'70%', right:'5%',  sz:5,  cl:'bg-pink-300 dark:bg-pink-500/25',      anim:'saiFloat', dur:5.5, del:2 },
    { t:'dot', top:'88%', left:'10%',  sz:6,  cl:'bg-indigo-300 dark:bg-indigo-500/25',  anim:'saiFloat', dur:3.8, del:1.5 },
    { t:'ring', top:'10%', left:'20%', sz:13, cl:'border-sky-300/50 dark:border-sky-500/20',      anim:'saiPulse', dur:5,   del:0.3 },
    { t:'ring', top:'55%', right:'8%', sz:11, cl:'border-violet-300/50 dark:border-violet-500/20', anim:'saiPulse', dur:6,   del:1.8 },
    { t:'cross', top:'25%', left:'5%',  sz:9,  cl:'bg-blue-300/60 dark:bg-blue-500/20',    anim:'saiSpin', dur:12, del:0 },
    { t:'cross', top:'75%', right:'6%', sz:8,  cl:'bg-purple-300/60 dark:bg-purple-500/20', anim:'saiSpin', dur:15, del:2 },
    { t:'diamond', top:'18%', right:'18%', sz:7, cl:'bg-cyan-300/50 dark:bg-cyan-500/20',    anim:'saiDrift', dur:6,   del:1 },
    { t:'diamond', top:'60%', left:'12%',  sz:6, cl:'bg-pink-300/50 dark:bg-pink-500/20',    anim:'saiDrift', dur:7,   del:2.5 },
    { t:'diamond', top:'85%', right:'22%', sz:6, cl:'bg-indigo-300/50 dark:bg-indigo-500/20', anim:'saiDrift', dur:6,   del:3 },
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

/* ── Feature items ── */
const features = [
    { icon: Eye,    title: "Face Emotion Scan",   desc: "Camera reads your expressions in real-time", gradient: "from-sky-400 to-blue-500",  shadow: "shadow-sky-400/25" },
    { icon: Brain,  title: "AI Mood Analysis",     desc: "Smart insights about how you're feeling",    gradient: "from-violet-400 to-purple-500", shadow: "shadow-violet-400/25" },
    { icon: Zap,    title: "Instant Results",      desc: "Get your emotional report in seconds",       gradient: "from-amber-400 to-orange-500",  shadow: "shadow-amber-400/25" },
    { icon: Shield, title: "100% Private",         desc: "Nothing is stored — your face stays safe",   gradient: "from-emerald-400 to-teal-500",  shadow: "shadow-emerald-400/25" },
];

const StudentAICheckinPage = memo(function StudentAICheckinPage() {
    const navigate = useNavigate();
    const [isAlreadyDone, setIsAlreadyDone] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await checkinService.getTodayCheckinStatus();
                if (response.data.status?.hasAICheckin) {
                    setIsAlreadyDone(true);
                }
            } catch (e) {
                // ignore
            } finally {
                setIsLoading(false);
            }
        };
        checkStatus();
    }, []);

    return (
        <AnimatedPage>
            <Helmet><title>AI Emotional Analysis - Millennia World School</title></Helmet>
            <ScopedStyles />

            <div
                className="sai-bg sai-font student-shell min-h-screen relative overflow-hidden bg-gradient-to-br from-sky-50 via-violet-50 via-50% to-indigo-50 dark:from-background dark:via-background dark:to-background"
                data-student-theme="ai-checkin"
            >
                <div className="sai-grid absolute inset-0 pointer-events-none" />

                {/* Blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -right-16 w-80 sm:w-[400px] h-80 sm:h-[400px] rounded-full blur-3xl bg-gradient-to-br from-sky-200/50 via-blue-200/35 to-indigo-100/25 dark:from-sky-500/8 dark:via-blue-500/4 dark:to-transparent" style={{ animation: 'saiBlob 10s ease-in-out infinite' }} />
                    <div className="absolute -bottom-16 -left-16 w-72 sm:w-[370px] h-72 sm:h-[370px] rounded-full blur-3xl bg-gradient-to-br from-violet-200/50 via-purple-200/35 to-pink-100/25 dark:from-violet-500/8 dark:via-purple-500/4 dark:to-transparent" style={{ animation: 'saiBlob 12s ease-in-out infinite', animationDelay: '3s' }} />
                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl bg-gradient-to-br from-blue-100/45 via-cyan-100/25 to-transparent dark:from-blue-500/5 dark:to-transparent" style={{ animation: 'saiBlob 9s ease-in-out infinite', animationDelay: '1.5s' }} />
                    <div className="absolute bottom-[15%] right-[5%] w-56 sm:w-68 h-56 sm:h-68 rounded-full blur-3xl bg-gradient-to-br from-pink-100/40 via-rose-100/25 to-transparent dark:from-pink-500/5 dark:to-transparent" style={{ animation: 'saiBlob 11s ease-in-out infinite', animationDelay: '5s' }} />
                    <div className="absolute top-[8%] -left-10 w-48 sm:w-60 h-48 sm:h-60 rounded-full blur-3xl bg-gradient-to-br from-indigo-100/40 via-blue-100/20 to-transparent dark:from-indigo-500/5 dark:to-transparent" style={{ animation: 'saiBlob 8s ease-in-out infinite', animationDelay: '2s' }} />
                    {particles.map((p, i) => <Particle key={i} p={p} />)}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center px-4 py-6 sm:py-10 max-w-lg mx-auto min-h-screen">

                    {/* Back */}
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate('/student/emotional-checkin')}
                        className="ios-pill self-start flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mb-6 font-semibold px-3 py-1.5"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </motion.button>

                    {/* Illustration area */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative w-32 h-32 sm:w-40 sm:h-40 mb-6"
                    >
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-200/60 via-violet-200/40 to-pink-200/30 dark:from-sky-500/10 dark:via-violet-500/8 dark:to-pink-500/5 backdrop-blur-sm" />
                        {/* Inner circle */}
                        <div className="absolute inset-3 sm:inset-4 rounded-full bg-gradient-to-br from-sky-400 via-blue-500 to-violet-500 flex items-center justify-center shadow-xl shadow-blue-500/30">
                            <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                        </div>
                        {/* Orbiting particles */}
                        <div className="absolute inset-0" style={{ animation: 'saiOrbit 8s linear infinite' }}>
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 shadow-lg shadow-pink-400/40" />
                        </div>
                        <div className="absolute inset-0" style={{ animation: 'saiOrbit 12s linear infinite reverse', animationDelay: '2s' }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 shadow-lg shadow-amber-400/40" />
                        </div>
                    </motion.div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="text-center mb-6"
                    >
                        <div className="ios-pill inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/70 dark:bg-white/8 border border-gray-200/40 dark:border-white/10 backdrop-blur-sm mb-3 shadow-sm">
                            <Sparkles className="w-3 h-3 text-sky-500" />
                            <span className="text-[10px] font-extrabold tracking-widest text-sky-600 dark:text-sky-400 uppercase">AI Analysis</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-2">
                            <span className="sai-title bg-gradient-to-r from-sky-500 via-blue-500 via-40% to-violet-500 dark:from-sky-400 dark:via-blue-400 dark:to-violet-400">
                                AI Emotional Scan
                            </span>
                        </h1>
                        <p className="text-[13px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
                            Let our AI read your expressions and give you friendly insights about how you're feeling today.
                        </p>
                    </motion.div>

                    {/* Already done notice */}
                    {!isLoading && isAlreadyDone && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="ios-glass-soft w-full backdrop-blur-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 dark:from-emerald-900/20 dark:to-teal-900/10 border border-emerald-200/50 dark:border-emerald-700/40 rounded-2xl p-4 mb-5 flex items-center gap-3"
                        >
                            <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">You've already completed your AI analysis today!</p>
                        </motion.div>
                    )}

                    {/* Features */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        className="w-full grid grid-cols-2 gap-3 mb-6"
                    >
                        {features.map((feat, i) => {
                            const Icon = feat.icon;
                            return (
                                <motion.div
                                    key={feat.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + i * 0.08 }}
                                    className="ios-glass backdrop-blur-xl bg-white/55 dark:bg-white/5 border border-white/70 dark:border-white/10 rounded-2xl p-3.5 shadow-sm"
                                >
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${feat.gradient} flex items-center justify-center shadow-lg ${feat.shadow} mb-2`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <p className="text-xs font-bold text-gray-700 dark:text-white mb-0.5">{feat.title}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-snug">{feat.desc}</p>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="w-full"
                    >
                        <Button
                            type="button"
                            onMouseEnter={prefetchStudentFaceScanOnIntent}
                            onFocus={prefetchStudentFaceScanOnIntent}
                            onTouchStart={prefetchStudentFaceScanOnIntent}
                            onClick={() => navigate('/student/emotional-checkin/face-scan')}
                            disabled={isAlreadyDone}
                            className="w-full rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-violet-500 hover:from-sky-600 hover:via-blue-600 hover:to-violet-600 text-white font-extrabold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 py-3"
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            {isAlreadyDone ? "AI Analysis Completed" : "Start Face Scan"}
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-2">
                            Your camera will open — no photos are saved
                        </p>
                    </motion.div>

                    {/* Footer */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-auto pt-8 text-[10px] text-gray-300 dark:text-gray-600 tracking-wide font-semibold"
                    >
                        Millennia World School
                    </motion.p>
                </div>
            </div>
        </AnimatedPage>
    );
});

StudentAICheckinPage.displayName = 'StudentAICheckinPage';

export default StudentAICheckinPage;
