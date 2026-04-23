import { memo, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, NotebookPen, LineChart } from "lucide-react";
const toTitleCase = (value = "") =>
    value
        .toString()
        .replace(/_/g, " ")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateLabel = (value) => {
    if (!value) return "-";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    });
};
const buildSparklinePoints = (trend = [], key = "presence") => {
    const values = trend.map((item) => (typeof item?.[key] === "number" ? item[key] : null));
    const validValues = values.filter((value) => value != null);
    if (!validValues.length || trend.length < 2) return "";

    const min = Math.min(...validValues, 1);
    const max = Math.max(...validValues, 10);
    const width = 280;
    const height = 100;
    const paddingX = 12;
    const paddingY = 10;

    return trend
        .map((point, index) => {
            const numeric = typeof point?.[key] === "number" ? point[key] : min;
            const x = paddingX + (index / (trend.length - 1)) * (width - paddingX * 2);
            const normalized = max === min ? 0.5 : (numeric - min) / (max - min);
            const y = height - paddingY - normalized * (height - paddingY * 2);
            return `${x},${y}`;
        })
        .join(" ");
};
const moodTone = {
    positive: "bg-emerald-100 text-emerald-700",
    balanced: "bg-sky-100 text-sky-700",
    depleted: "bg-amber-100 text-amber-700",
    challenging: "bg-rose-100 text-rose-700"
};

const StudentCheckinInsightCard = memo(({ student }) => {
    const [expanded, setExpanded] = useState(false);
    const checkin = student?.checkin;
    const progress = student?.progress || {};
    const trend = useMemo(() => (Array.isArray(progress?.trend) ? progress.trend.slice(-7) : []), [progress?.trend]);
    const topMoods = Array.isArray(progress?.topMoods) ? progress.topMoods : [];
    const recentNotes = Array.isArray(progress?.recentNotes) ? progress.recentNotes : [];
    const moodState = checkin?.aiAnalysis?.emotionalState || trend[trend.length - 1]?.moodState || "balanced";
    const todayNote = checkin?.reflections?.userReflection || checkin?.reflections?.details || "";
    const presenceLine = useMemo(() => buildSparklinePoints(trend, "presence"), [trend]);
    const capacityLine = useMemo(() => buildSparklinePoints(trend, "capacity"), [trend]);
    return (
        <div className="rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm">
            <div className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                    <div>
                        <p className="text-base font-semibold text-foreground">
                            {student?.nickname || student?.name || "Unnamed student"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {student?.currentGrade || "Grade"} - {student?.className || "Class"}
                        </p>
                        {student?.email && <p className="text-xs text-muted-foreground">{student.email}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {checkin ? (
                            <>
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                    {toTitleCase(checkin?.weatherType || "Submitted")}
                                </span>
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                                    P {checkin?.presenceLevel ?? "-"} / C {checkin?.capacityLevel ?? "-"}
                                </span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${moodTone[moodState] || moodTone.balanced}`}>
                                    {toTitleCase(moodState)}
                                </span>
                                {checkin?.aiAnalysis?.needsSupport && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 inline-flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Needs support
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                Not submitted
                            </span>
                        )}
                    </div>
                </div>
                {todayNote && (
                    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-[11px] uppercase tracking-wide text-primary font-semibold mb-1">Today note</p>
                        <p className="text-sm text-foreground/90 line-clamp-2">{todayNote}</p>
                    </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        14d submissions: {progress?.submissionsLast14Days || 0}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        Avg P: {progress?.averagePresence ?? "-"}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        Avg C: {progress?.averageCapacity ?? "-"}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="mt-3 text-sm text-primary font-medium inline-flex items-center gap-1.5 hover:underline"
                >
                    {expanded ? (
                        <><ChevronUp className="w-4 h-4" /> Hide insights</>
                    ) : (
                        <><ChevronDown className="w-4 h-4" /> View note + mood trend</>
                    )}
                </button>
            </div>
            {expanded && (
                <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-4">
                    <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                            <LineChart className="w-3.5 h-3.5" /> Mood & energy trend (7 days)
                        </p>
                        {trend.length > 1 ? (
                            <>
                                <svg viewBox="0 0 280 100" className="w-full h-24">
                                    {[20, 50, 80].map((y) => (
                                        <line key={y} x1="8" y1={y} x2="272" y2={y} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
                                    ))}
                                    <polyline fill="none" stroke="rgba(14,165,233,0.95)" strokeWidth="3" strokeLinecap="round" points={presenceLine} />
                                    <polyline fill="none" stroke="rgba(168,85,247,0.95)" strokeWidth="3" strokeLinecap="round" points={capacityLine} />
                                </svg>
                                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                                    <span>{formatDateLabel(trend[0]?.date)}</span>
                                    <span>{formatDateLabel(trend[trend.length - 1]?.date)}</span>
                                </div>
                                <div className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
                                    <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Presence</span>
                                    <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500" /> Capacity</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Need at least two check-ins to show trend.</p>
                        )}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2 inline-flex items-center gap-1.5">
                                <NotebookPen className="w-3.5 h-3.5" /> Recent notes
                            </p>
                            {recentNotes.length ? (
                                <div className="space-y-2">
                                    {recentNotes.map((note) => (
                                        <div key={note.id} className="rounded-lg border border-border/50 bg-card/70 p-2.5">
                                            <p className="text-[11px] text-muted-foreground mb-1">{formatDateLabel(note.date)} • {toTitleCase(note.source)}</p>
                                            <p className="text-sm text-foreground/90 line-clamp-3">{note.note}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No note yet in recent check-ins.</p>
                            )}
                        </div>
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Mood highlights</p>
                            {topMoods.length ? (
                                <div className="flex flex-wrap gap-2">
                                    {topMoods.map((item) => (
                                        <span key={item.mood} className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary font-medium">
                                            {toTitleCase(item.mood)} ({item.count})
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No mood history available yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
StudentCheckinInsightCard.displayName = "StudentCheckinInsightCard";
export default StudentCheckinInsightCard;
