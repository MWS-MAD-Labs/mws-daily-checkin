import { memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    X, Users, TrendingUp, AlertTriangle, CheckCircle,
    UserX, Activity, Sun, Cloud, CloudRain, Zap,
    Heart, Shield, ArrowRight
} from "lucide-react";
import { computeWorkdayCount } from "../utils/analyticsHelpers";

const WEATHER_ICONS = {
    sunny: Sun, 'clear-sky': Sun, clear: Sun,
    cloudy: Cloud, overcast: Cloud, 'partly-cloudy': Cloud,
    rainy: CloudRain, rain: CloudRain, 'light-rain': CloudRain, stormy: CloudRain,
    thunderstorm: Zap, lightning: Zap
};

const SummaryModal = memo(({ isOpen, onClose, data, period, isHeadUnit, isDirectorate, userUnit }) => {
    const navigate = useNavigate();

    const summary = useMemo(() => {
        if (!data) return null;

        const totalUsers = data.totalUsers || 0;
        const totalCheckins = data.totalCheckins || 0;
        const timeline = Array.isArray(data.periodTimeline) ? data.periodTimeline : [];
        const periodLengthDays = data.periodLengthDays || timeline.length || 0;
        const workdays = Math.max(computeWorkdayCount(timeline, periodLengthDays, period), 1);
        const expected = totalUsers * workdays;
        const participationRate = expected > 0 ? Math.min(100, Math.round((totalCheckins / expected) * 100)) : 0;

        const notSubmitted = Array.isArray(data.notSubmittedUsers) ? data.notSubmittedUsers : [];
        const flagged = Array.isArray(data.flaggedUsers) ? data.flaggedUsers : [];
        const requests = Array.isArray(data.checkinRequests) ? data.checkinRequests : [];
        const pendingRequests = requests.filter(r => r.status === 'pending');

        // Unique flagged users
        const flaggedMap = new Map();
        flagged.forEach(r => {
            const key = (r?.userId?._id || r?.userId || r?.id || '').toString();
            if (key && !flaggedMap.has(key)) flaggedMap.set(key, r);
        });
        const uniqueFlagged = Array.from(flaggedMap.values());

        // Readiness
        const checkedIn = Math.max(0, totalUsers - notSubmitted.length);
        const ready = Math.max(0, checkedIn - uniqueFlagged.length);
        const readiness = totalUsers > 0 ? Math.round((ready / totalUsers) * 100) : 0;

        // Moods
        const moodDist = data.moodDistribution || {};
        const topMoods = Object.entries(moodDist)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        const totalMoodVotes = Object.values(moodDist).reduce((s, c) => s + c, 0);

        // Weather
        const weatherDist = data.weatherDistribution || {};
        const topWeather = Object.entries(weatherDist)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        // Averages
        const avgPresence = data.averagePresence || 0;
        const avgCapacity = data.averageCapacity || 0;

        // Health score (composite)
        const healthScore = Math.round(
            (participationRate * 0.3) +
            (readiness * 0.3) +
            (Math.min(avgPresence, 10) * 10 * 0.2) +
            (Math.min(avgCapacity, 10) * 10 * 0.2)
        );

        return {
            totalUsers, totalCheckins, participationRate, workdays, expected,
            notSubmitted, uniqueFlagged, pendingRequests,
            checkedIn, ready, readiness,
            topMoods, totalMoodVotes, topWeather,
            avgPresence, avgCapacity, healthScore
        };
    }, [data, period]);

    if (!isOpen || !summary) return null;

    const periodLabel = { today: 'Today', week: 'This Week', month: 'This Month', semester: 'This Semester', all: 'All Time' }[period] || period;

    const getHealthColor = (score) => {
        if (score >= 75) return 'text-emerald-600';
        if (score >= 50) return 'text-amber-600';
        return 'text-red-600';
    };

    const getHealthBg = (score) => {
        if (score >= 75) return 'from-emerald-500/20 to-emerald-500/5';
        if (score >= 50) return 'from-amber-500/20 to-amber-500/5';
        return 'from-red-500/20 to-red-500/5';
    };

    const getHealthLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 65) return 'Good';
        if (score >= 50) return 'Fair';
        if (score >= 35) return 'Needs Attention';
        return 'Critical';
    };

    const getScoreBarColor = (val, max = 10) => {
        const pct = (val / max) * 100;
        if (pct >= 70) return 'bg-emerald-500';
        if (pct >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div
            className="fixed inset-0 bg-foreground/60 dark:bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            style={{ zIndex: 10000 }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border/50 animate-in fade-in-0 zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border/40 bg-gradient-to-r from-primary/10 to-transparent">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            {isHeadUnit ? `${userUnit || 'Unit'} Summary` : isDirectorate ? 'Organization Summary' : 'Wellness Summary'}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {periodLabel} · {summary.totalUsers} team members
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="p-5 overflow-y-auto max-h-[calc(90vh-80px)] space-y-5">

                    {/* Health Score */}
                    <div className={`rounded-xl p-4 bg-gradient-to-br ${getHealthBg(summary.healthScore)} border border-border/30`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Health Score</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className={`text-4xl font-bold ${getHealthColor(summary.healthScore)}`}>
                                        {summary.healthScore}
                                    </span>
                                    <span className="text-sm text-muted-foreground">/ 100</span>
                                </div>
                                <p className={`text-sm font-medium mt-0.5 ${getHealthColor(summary.healthScore)}`}>
                                    {getHealthLabel(summary.healthScore)}
                                </p>
                            </div>
                            <div className="w-16 h-16 rounded-full border-4 border-current flex items-center justify-center"
                                style={{ borderColor: summary.healthScore >= 75 ? '#10b981' : summary.healthScore >= 50 ? '#d97706' : '#ef4444' }}
                            >
                                <Heart className="w-7 h-7" style={{ color: summary.healthScore >= 75 ? '#10b981' : summary.healthScore >= 50 ? '#d97706' : '#ef4444' }} />
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Based on participation ({summary.participationRate}%), readiness ({summary.readiness}%), avg presence ({summary.avgPresence}/10), avg capacity ({summary.avgCapacity}/10)
                        </p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-xl border border-border/40 p-3 bg-card/50">
                            <Users className="w-4 h-4 text-blue-500 mb-1" />
                            <p className="text-xl font-bold">{summary.participationRate}%</p>
                            <p className="text-[10px] text-muted-foreground">Participation</p>
                        </div>
                        <div className="rounded-xl border border-border/40 p-3 bg-card/50">
                            <TrendingUp className="w-4 h-4 text-emerald-500 mb-1" />
                            <p className="text-xl font-bold">{summary.readiness}%</p>
                            <p className="text-[10px] text-muted-foreground">Readiness</p>
                        </div>
                        <div className="rounded-xl border border-border/40 p-3 bg-card/50">
                            <Activity className="w-4 h-4 text-violet-500 mb-1" />
                            <p className="text-xl font-bold">{summary.avgPresence}</p>
                            <p className="text-[10px] text-muted-foreground">Avg Presence</p>
                        </div>
                        <div className="rounded-xl border border-border/40 p-3 bg-card/50">
                            <Zap className="w-4 h-4 text-amber-500 mb-1" />
                            <p className="text-xl font-bold">{summary.avgCapacity}</p>
                            <p className="text-[10px] text-muted-foreground">Avg Capacity</p>
                        </div>
                    </div>

                    {/* Presence & Capacity bars */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">Presence</span>
                            <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${getScoreBarColor(summary.avgPresence)}`}
                                    style={{ width: `${Math.min(summary.avgPresence * 10, 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{summary.avgPresence}/10</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-16 shrink-0">Capacity</span>
                            <div className="flex-1 bg-muted/30 rounded-full h-2 overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${getScoreBarColor(summary.avgCapacity)}`}
                                    style={{ width: `${Math.min(summary.avgCapacity * 10, 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium w-10 text-right">{summary.avgCapacity}/10</span>
                        </div>
                    </div>

                    {/* Alerts Section */}
                    {(summary.uniqueFlagged.length > 0 || summary.pendingRequests.length > 0 || summary.notSubmitted.length > 0) && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Requires Attention</p>

                            {summary.pendingRequests.length > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200/60 dark:border-red-500/20">
                                    <Shield className="w-4 h-4 text-red-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                            {summary.pendingRequests.length} pending support request{summary.pendingRequests.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-xs text-red-600/70 dark:text-red-400/70 truncate">
                                            {summary.pendingRequests.map(r => r.requestedBy).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {summary.uniqueFlagged.length > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                            {summary.uniqueFlagged.length} flagged user{summary.uniqueFlagged.length > 1 ? 's' : ''}
                                        </p>
                                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 truncate">
                                            {summary.uniqueFlagged.map(u => u.name).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {summary.notSubmitted.length > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-500/10 border border-slate-200/60 dark:border-slate-500/20">
                                    <UserX className="w-4 h-4 text-slate-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-400">
                                            {summary.notSubmitted.length} haven't checked in
                                        </p>
                                        <p className="text-xs text-slate-600/70 dark:text-slate-400/70 truncate">
                                            {summary.notSubmitted.map(u => u.name).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No alerts */}
                    {summary.uniqueFlagged.length === 0 && summary.pendingRequests.length === 0 && summary.notSubmitted.length === 0 && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                All team members are in good standing. No issues detected.
                            </p>
                        </div>
                    )}

                    {/* Mood & Weather */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Top Moods */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Moods</p>
                            <div className="space-y-1.5">
                                {summary.topMoods.length > 0 ? summary.topMoods.map(([mood, count]) => {
                                    const pct = summary.totalMoodVotes > 0 ? Math.round((count / summary.totalMoodVotes) * 100) : 0;
                                    return (
                                        <div key={mood} className="flex items-center gap-2">
                                            <span className="text-xs capitalize w-20 truncate text-foreground">{mood}</span>
                                            <div className="flex-1 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                                <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[10px] text-muted-foreground w-12 text-right">{pct}% ({count})</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-xs text-muted-foreground">No mood data</p>
                                )}
                            </div>
                        </div>

                        {/* Top Weather */}
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Weather Snapshot</p>
                            <div className="space-y-1.5">
                                {summary.topWeather.length > 0 ? summary.topWeather.map(([weather, count]) => {
                                    const WeatherIcon = WEATHER_ICONS[weather.toLowerCase()] || Cloud;
                                    return (
                                        <div key={weather} className="flex items-center gap-2 text-xs">
                                            <WeatherIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            <span className="capitalize text-foreground">{weather}</span>
                                            <span className="text-muted-foreground ml-auto">{count}</span>
                                        </div>
                                    );
                                }) : (
                                    <p className="text-xs text-muted-foreground">No weather data</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Participation Detail */}
                    <div className="rounded-xl border border-border/30 p-3 bg-muted/10">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Participation Breakdown</p>
                        <div className="flex items-center justify-between text-xs text-foreground">
                            <span>Check-ins submitted</span>
                            <span className="font-medium">{summary.totalCheckins}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-foreground mt-1">
                            <span>Expected ({summary.workdays} workday{summary.workdays > 1 ? 's' : ''} × {summary.totalUsers} users)</span>
                            <span className="font-medium">{summary.expected}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-foreground mt-1">
                            <span>Unique users checked in</span>
                            <span className="font-medium">{summary.checkedIn} of {summary.totalUsers}</span>
                        </div>
                    </div>

                    {/* Quick action */}
                    {summary.uniqueFlagged.length > 0 && (
                        <button
                            onClick={() => {
                                onClose();
                                const flaggedEl = document.querySelector('[data-section="flagged-users"]');
                                if (flaggedEl) flaggedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
                        >
                            View flagged users details
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

SummaryModal.displayName = 'SummaryModal';
export default SummaryModal;
