import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCheckinHistory } from "../../../store/slices/checkinSlice";
import {
    User, TrendingUp, Calendar, Heart, Activity, ChevronDown, ChevronUp,
    AlertTriangle, Brain, MessageCircle, Shield, Clock, Sun, Cloud, CloudRain, Zap,
    Loader2, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { Button } from "../../../components/ui/button";

/* ── helpers ── */
const WEATHER_ICONS = { sunny: Sun, cloudy: Cloud, rainy: CloudRain, stormy: Zap };
const WEATHER_COLORS = {
    sunny: "text-amber-500", cloudy: "text-slate-400",
    rainy: "text-blue-400", stormy: "text-purple-500"
};

const fmt = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const fmtFull = (d) => {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
};

const fmtTime = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

const PERIOD_OPTIONS = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" }
];

const getDateRange = (period) => {
    if (period === "all") {
        return { startDate: null, endDate: null, label: "All Time" };
    }

    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    if (period === "week") {
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    } else {
        start.setDate(1);
    }
    start.setHours(0, 0, 0, 0);

    return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        label: period === "week" ? "This Week" : "This Month"
    };
};

const presenceColor = (v) => v >= 7 ? "text-emerald-600" : v >= 4 ? "text-amber-600" : "text-rose-600";
const capacityColor = (v) => v >= 7 ? "text-blue-600" : v >= 4 ? "text-amber-600" : "text-rose-600";

/* ── Expandable CheckIn Row ── */
const CheckInRow = memo(({ checkin, isLast }) => {
    const [open, setOpen] = useState(false);

    const WeatherIcon = WEATHER_ICONS[checkin.weatherType] || Sun;
    const weatherColor = WEATHER_COLORS[checkin.weatherType] || "text-amber-500";
    const aiNeedsSupport = checkin.aiAnalysis?.needsSupport &&
        !(checkin.presenceLevel >= 7 && checkin.capacityLevel >= 7);
    const userRequestedSupport = !!(checkin.supportContactUserId || checkin.supportContactLegacyLabel);
    const hasAnySupportFlag = aiNeedsSupport || userRequestedSupport;

    return (
        <div className={`${!isLast ? "border-b border-border/40" : ""}`}>
            {/* Row summary — always visible */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors text-left"
            >
                {/* Date */}
                <div className="min-w-[90px]">
                    <span className="text-sm font-medium">{fmt(checkin.date)}</span>
                    {checkin.submittedAt && (
                        <span className="block text-[10px] text-muted-foreground">{fmtTime(checkin.submittedAt)}</span>
                    )}
                </div>

                {/* Weather */}
                <WeatherIcon className={`w-4 h-4 flex-shrink-0 ${weatherColor}`} />

                {/* Presence / Capacity inline */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-sm font-semibold ${presenceColor(checkin.presenceLevel)}`}>
                        P:{checkin.presenceLevel}
                    </span>
                    <span className={`text-sm font-semibold ${capacityColor(checkin.capacityLevel)}`}>
                        C:{checkin.capacityLevel}
                    </span>
                    {/* Moods preview */}
                    <div className="hidden sm:flex gap-1 overflow-hidden">
                        {(checkin.selectedMoods || []).slice(0, 2).map((m) => (
                            <Badge key={m} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {m}
                            </Badge>
                        ))}
                        {(checkin.selectedMoods?.length || 0) > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{checkin.selectedMoods.length - 2}</span>
                        )}
                    </div>
                </div>

                {/* Flags */}
                {userRequestedSupport && (
                    <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" title="Requested support" />
                )}
                {aiNeedsSupport && !userRequestedSupport && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" title="AI flagged" />
                )}

                {/* Expand indicator */}
                {open
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
            </button>

            {/* Expanded detail */}
            {open && (
                <div className="px-3 pb-3 space-y-3 bg-muted/10 border-t border-border/30">
                    <div className="pt-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            {fmtFull(checkin.date)}
                        </p>
                    </div>

                    {/* Presence & Capacity bars */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Presence</span>
                                <span className={`font-semibold ${presenceColor(checkin.presenceLevel)}`}>
                                    {checkin.presenceLevel}/10
                                </span>
                            </div>
                            <Progress value={checkin.presenceLevel * 10} className="h-1.5" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Capacity</span>
                                <span className={`font-semibold ${capacityColor(checkin.capacityLevel)}`}>
                                    {checkin.capacityLevel}/10
                                </span>
                            </div>
                            <Progress value={checkin.capacityLevel * 10} className="h-1.5" />
                        </div>
                    </div>

                    {/* Moods */}
                    {checkin.selectedMoods?.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <Heart className="w-3 h-3" /> Moods
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {checkin.selectedMoods.map((mood) => (
                                    <Badge key={mood} variant="secondary" className="text-xs">{mood}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* User Comment / Details */}
                    {checkin.details && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                                <MessageCircle className="w-3 h-3" /> Comment
                            </p>
                            <p className="text-sm bg-card/60 rounded-lg p-2.5 border border-border/30 leading-relaxed">
                                {checkin.details}
                            </p>
                        </div>
                    )}

                    {/* User Reflection */}
                    {checkin.userReflection && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                                <Brain className="w-3 h-3" /> Reflection
                            </p>
                            <p className="text-sm bg-card/60 rounded-lg p-2.5 border border-border/30 leading-relaxed">
                                {checkin.userReflection}
                            </p>
                        </div>
                    )}

                    {/* AI Analysis */}
                    {checkin.aiAnalysis && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                <Brain className="w-3 h-3" /> AI Analysis
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                {checkin.aiAnalysis.emotionalState && (
                                    <div className="bg-card/60 rounded-lg p-2 border border-border/30 text-center">
                                        <span className="text-muted-foreground block">Emotional</span>
                                        <span className="font-medium capitalize">{checkin.aiAnalysis.emotionalState}</span>
                                    </div>
                                )}
                                {checkin.aiAnalysis.presenceState && (
                                    <div className="bg-card/60 rounded-lg p-2 border border-border/30 text-center">
                                        <span className="text-muted-foreground block">Presence</span>
                                        <span className="font-medium capitalize">{checkin.aiAnalysis.presenceState}</span>
                                    </div>
                                )}
                                {checkin.aiAnalysis.capacityState && (
                                    <div className="bg-card/60 rounded-lg p-2 border border-border/30 text-center">
                                        <span className="text-muted-foreground block">Capacity</span>
                                        <span className="font-medium capitalize">{checkin.aiAnalysis.capacityState}</span>
                                    </div>
                                )}
                            </div>
                            {checkin.aiAnalysis.psychologicalInsights && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                    {checkin.aiAnalysis.psychologicalInsights}
                                </p>
                            )}
                            {checkin.aiAnalysis.motivationalMessage && (
                                <p className="text-xs text-primary mt-1">
                                    {checkin.aiAnalysis.motivationalMessage}
                                </p>
                            )}
                            {checkin.aiAnalysis.recommendations?.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Recommendations:</p>
                                    {checkin.aiAnalysis.recommendations.map((rec, i) => (
                                        <div key={i} className="text-xs bg-card/60 rounded p-1.5 border border-border/20">
                                            <span className="font-medium">{rec.title}</span>
                                            {rec.description && <span className="text-muted-foreground"> — {rec.description}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Support Section */}
                    {hasAnySupportFlag && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> Support Status
                            </p>

                            {userRequestedSupport && (
                                <div className="bg-rose-50 dark:bg-rose-950/30 rounded-lg p-2.5 border border-rose-200/50 dark:border-rose-800/40">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Shield className="w-3.5 h-3.5 text-rose-500" />
                                        <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                                            User Requested Support
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground ml-5">
                                        <span className="font-medium">Contact:</span>{" "}
                                        {checkin.supportContactUserId?.name || checkin.supportContactLegacyLabel || "—"}
                                        {checkin.supportContactResponse?.status && (
                                            <Badge variant="outline" className="ml-2 text-[10px] capitalize">
                                                {checkin.supportContactResponse.status}
                                            </Badge>
                                        )}
                                    </div>
                                    {checkin.supportContactResponse?.details && (
                                        <p className="text-xs text-muted-foreground ml-5 mt-1 italic">
                                            Response: {checkin.supportContactResponse.details}
                                        </p>
                                    )}
                                </div>
                            )}

                            {aiNeedsSupport && !userRequestedSupport && (
                                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2.5 border border-amber-200/50 dark:border-amber-800/40">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                            AI Detected Support Need
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground ml-5 mt-0.5">
                                        User did not select a support contact
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
CheckInRow.displayName = "CheckInRow";

/* ── Main Component ── */
const IndividualView = memo(({ selectedUser, targetUserId }) => {
    const dispatch = useDispatch();
    const { user: currentUser } = useSelector((state) => state.auth);
    const { checkinHistory } = useSelector((state) => state.checkin);

    const [period, setPeriod] = useState("month");
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
    const [reloadToken, setReloadToken] = useState(0);

    const resolvedUser = useMemo(() => {
        return selectedUser || (targetUserId ? { id: targetUserId } : currentUser) || null;
    }, [selectedUser, targetUserId, currentUser]);

    const resolvedUserId = useMemo(() => {
        return (
            resolvedUser?.id?.toString() ||
            resolvedUser?._id?.toString() ||
            targetUserId?.toString() ||
            currentUser?._id?.toString() ||
            currentUser?.id?.toString() ||
            ""
        );
    }, [resolvedUser, targetUserId, currentUser]);

    const dateRange = useMemo(() => getDateRange(period), [period]);

    const retryFetch = useCallback(() => {
        setReloadToken((value) => value + 1);
    }, []);

    useEffect(() => {
        if (!resolvedUserId) return;
        let isMounted = true;

        setHistoryLoading(true);
        setHistoryError(null);
        setHasLoadedHistory(false);

        dispatch(getCheckinHistory({
            page: 1,
            limit: period === "all" ? 120 : 60,
            userId: resolvedUserId,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
        }))
            .unwrap()
            .catch((error) => {
                if (!isMounted) return;
                setHistoryError(
                    typeof error === "string"
                        ? error
                        : "Failed to load this user's check-in history."
                );
            })
            .finally(() => {
                if (!isMounted) return;
                setHistoryLoading(false);
                setHasLoadedHistory(true);
            });

        return () => {
            isMounted = false;
        };
    }, [dispatch, resolvedUserId, period, dateRange.startDate, dateRange.endDate, reloadToken]);

    const checkins = useMemo(() => {
        if (!hasLoadedHistory) return [];
        if (!checkinHistory) return [];
        const data = checkinHistory.data || checkinHistory;
        const arr = Array.isArray(data) ? data : (data.checkins || []);
        return [...arr].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [checkinHistory, hasLoadedHistory]);

    /* ── Wellness Snapshot (computed from filtered period) ── */
    const snapshot = useMemo(() => {
        if (!checkins.length) return null;

        let totalP = 0, totalC = 0, supportRequests = 0, aiFlags = 0;
        const moodFreq = {};

        checkins.forEach((c) => {
            totalP += c.presenceLevel || 0;
            totalC += c.capacityLevel || 0;
            if (c.supportContactUserId || c.supportContactLegacyLabel) supportRequests++;
            else if (c.aiAnalysis?.needsSupport && !(c.presenceLevel >= 7 && c.capacityLevel >= 7)) aiFlags++;
            (c.selectedMoods || []).forEach((m) => {
                moodFreq[m] = (moodFreq[m] || 0) + 1;
            });
        });

        const n = checkins.length;
        const avgP = Math.round((totalP / n) * 10) / 10;
        const avgC = Math.round((totalC / n) * 10) / 10;
        const topMoods = Object.entries(moodFreq).sort(([, a], [, b]) => b - a).slice(0, 5);

        return { total: n, avgP, avgC, supportRequests, aiFlags, topMoods };
    }, [checkins]);

    /* ── Empty states ── */
    if (!resolvedUser) {
        return (
            <Card>
                <CardContent className="text-center py-16">
                    <User className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Unable to load user report.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* ── Period Filter ── */}
            <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Period:</span>
                <div className="flex gap-1">
                    {PERIOD_OPTIONS.map((opt) => (
                        <Button
                            key={opt.key}
                            size="sm"
                            variant={period === opt.key ? "default" : "outline"}
                            className="h-7 text-xs px-3"
                            onClick={() => setPeriod(opt.key)}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
                {historyLoading && (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin ml-2" />
                )}
            </div>

            {historyError && (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-destructive">Unable to load report history</p>
                            <p className="text-xs text-muted-foreground mt-1">{historyError}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={retryFetch} className="flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {historyLoading && !hasLoadedHistory ? (
                <Card>
                    <CardContent className="py-12 flex items-center justify-center gap-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        Loading full report...
                    </CardContent>
                </Card>
            ) : (
                <>

            {/* ── Stats + Wellness Snapshot Card ── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <User className="w-4 h-4" />
                        {resolvedUser.name || "User"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Emotional wellness analysis — {dateRange.label}
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-primary/5 rounded-lg">
                            <div className="text-xl font-bold text-primary">{snapshot?.total ?? 0}</div>
                            <div className="text-[11px] text-muted-foreground">Total Check-ins</div>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                            <div className={`text-xl font-bold ${presenceColor(snapshot?.avgP ?? 0)}`}>
                                {snapshot?.avgP ?? 0}
                            </div>
                            <div className="text-[11px] text-muted-foreground">Avg Presence</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                            <div className={`text-xl font-bold ${capacityColor(snapshot?.avgC ?? 0)}`}>
                                {snapshot?.avgC ?? 0}
                            </div>
                            <div className="text-[11px] text-muted-foreground">Avg Capacity</div>
                        </div>
                        <div className="text-center p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                            <div className="text-xl font-bold text-rose-600">{snapshot?.supportRequests ?? 0}</div>
                            <div className="text-[11px] text-muted-foreground">Support Requests</div>
                        </div>
                    </div>

                    {/* Wellness Snapshot — Presence & Capacity trends */}
                    {snapshot && (
                        <>
                            <div className="border-t pt-3">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    {period === "week" ? "Weekly" : period === "month" ? "Monthly" : "Overall"} Wellness Snapshot
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>Presence trend</span>
                                            <span className={`font-semibold ${presenceColor(snapshot.avgP)}`}>
                                                {snapshot.avgP}/10
                                            </span>
                                        </div>
                                        <Progress value={snapshot.avgP * 10} className="h-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                            <span>Capacity trend</span>
                                            <span className={`font-semibold ${capacityColor(snapshot.avgC)}`}>
                                                {snapshot.avgC}/10
                                            </span>
                                        </div>
                                        <Progress value={snapshot.avgC * 10} className="h-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Top Moods */}
                            {snapshot.topMoods.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                        <Heart className="w-3.5 h-3.5" />
                                        Dominant Moods
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {snapshot.topMoods.map(([mood, count]) => (
                                            <Badge key={mood} variant="outline" className="text-xs">
                                                {mood} — {count}x
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* ── Check-in History ── */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Check-in History
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                            {checkins.length} record{checkins.length !== 1 ? "s" : ""}
                        </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Tap a row to see full details — comment, AI analysis, support status
                    </p>
                </CardHeader>
                <CardContent className="p-0">
                    {checkins.length === 0 ? (
                        <div className="text-center py-10 px-4">
                            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                {historyLoading ? "Refreshing..." : `No check-ins found for ${dateRange.label.toLowerCase()}.`}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y-0">
                            {checkins.map((checkin, i) => (
                                <CheckInRow
                                    key={checkin._id || checkin.id || i}
                                    checkin={checkin}
                                    isLast={i === checkins.length - 1}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
                </>
            )}
        </div>
    );
});

IndividualView.displayName = "IndividualView";

export default IndividualView;
