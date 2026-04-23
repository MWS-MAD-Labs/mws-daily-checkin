import { memo, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, AlertTriangle, Search, ArrowUpRight, TrendingUp, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import UserDetailModal from "./UserDetailModal";
import { formatCalendarDateKey, formatCalendarDateLabel, getTodayCalendarDateKey, parseCalendarDate } from "../utils/calendarDate";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const formatRelativeDate = (value) => {
    if (!value) return 'No activity yet';
    const date = parseCalendarDate(value);
    if (!date) return 'No activity yet';

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = today.getTime() - compareDate.getTime();
    if (diff === 0) return 'Today';
    if (diff === DAY_IN_MS) return 'Yesterday';
    const days = Math.floor(diff / DAY_IN_MS);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
};

const formatScore = (score) => {
    if (typeof score !== 'number' || Number.isNaN(score)) return '–';
    return `${Math.round(score * 10) / 10}/10`;
};

const HeadUnitStaffPanel = memo(({ staff = [], summary, isDirectorate = false }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [detailUser, setDetailUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeReferenceLabel = useMemo(() => {
        const referenceDateKey = summary?.referenceDateKey;
        if (!referenceDateKey) return "Active Today";
        if (referenceDateKey === getTodayCalendarDateKey()) return "Active Today";
        return `Active on ${formatCalendarDateLabel(referenceDateKey, { month: "short", day: "numeric" })}`;
    }, [summary?.referenceDateKey]);

    const computedSummary = useMemo(() => {
        if (summary) {
            return {
                total: summary.totalMembers ?? staff.length,
                activeToday: summary.activeToday ?? 0,
                flagged: summary.flaggedMembers ?? 0,
                submissions: summary.submittedInPeriod ?? 0
            };
        }

        const todayKey = getTodayCalendarDateKey();
        const activeToday = staff.filter(member => {
            const lastDate = member.lastCheckin?.date;
            if (!lastDate) return false;
            const compare = new Date(lastDate);
            compare.setHours(0, 0, 0, 0);
            return formatCalendarDateKey(compare) === todayKey;
        }).length;
        const flagged = staff.filter(member =>
            member.lastCheckin?.needsSupport ||
            (member.periodSummary?.needsSupportDays || 0) > 0
        ).length;
        const submissions = staff.filter(member => (member.periodSummary?.submissions || 0) > 0).length;

        return {
            total: staff.length,
            activeToday,
            flagged,
            submissions
        };
    }, [staff, summary]);

    const filteredStaff = useMemo(() => {
        if (!search.trim()) {
            return [...staff].sort((a, b) => {
                const aTime = a.lastCheckin?.date ? new Date(a.lastCheckin.date).getTime() : 0;
                const bTime = b.lastCheckin?.date ? new Date(b.lastCheckin.date).getTime() : 0;
                return bTime - aTime;
            });
        }

        const query = search.trim().toLowerCase();
        return staff
            .filter(member => {
                const haystack = `${member.name} ${member.email || ''} ${member.department || ''} ${member.unit || ''}`.toLowerCase();
                return haystack.includes(query);
            })
            .sort((a, b) => {
                const aTime = a.lastCheckin?.date ? new Date(a.lastCheckin.date).getTime() : 0;
                const bTime = b.lastCheckin?.date ? new Date(b.lastCheckin.date).getTime() : 0;
                return bTime - aTime;
            });
    }, [staff, search]);

    const handleOpenModal = useCallback((member) => {
        setDetailUser({
            ...member,
            department: member.department || member.unit || 'Unit',
            lastCheckin: member.lastCheckin || null,
            periodSummary: member.periodSummary || null
        });
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    const panelTitle = isDirectorate ? 'Organization Wellness Explorer' : 'Team Members Overview';
    const panelSubtitle = isDirectorate
        ? 'View any staff member’s emotional check-ins and insights.'
        : 'Monitor your unit members with real-time insights.';

    if (!staff.length) {
        return (
            <Card className="glass glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {panelTitle}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10 text-muted-foreground">
                    <p>No staff with check-in data yet.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="glass glass-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        {panelTitle}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{panelSubtitle}</p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <div className="p-4 bg-card/40 border border-border/40 rounded-xl">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" /> Total Members
                            </p>
                            <p className="text-2xl font-semibold text-foreground mt-1">{computedSummary.total}</p>
                        </div>
                        <div className="p-4 bg-card/40 border border-border/40 rounded-xl">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {activeReferenceLabel}
                            </p>
                            <p className="text-2xl font-semibold text-foreground mt-1">{computedSummary.activeToday}</p>
                        </div>
                        <div className="p-4 bg-card/40 border border-border/40 rounded-xl">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" /> Recent Submissions
                            </p>
                            <p className="text-2xl font-semibold text-foreground mt-1">{computedSummary.submissions}</p>
                        </div>
                        <div className="p-4 bg-card/40 border border-border/40 rounded-xl">
                            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Needs Support
                            </p>
                            <p className="text-2xl font-semibold text-red-500 mt-1">{computedSummary.flagged}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div className="relative">
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={isDirectorate ? "Search staff by name, role, unit, or department..." : "Search by name, department, or unit..."}
                                className="pl-9 bg-card/60 border-border/60"
                            />
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[28rem] overflow-auto pr-1">
                        {filteredStaff.map(member => (
                            <div
                                key={member.id || member._id || member.email}
                                className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 border border-border/40 rounded-xl bg-card/30 hover:bg-card/60 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {member.role} - {member.department || member.unit || 'No unit'}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        Last check-in: {formatRelativeDate(member.lastCheckin?.date)}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                                        Presence {formatScore(member.periodSummary?.avgPresence ?? member.overallAvgPresence)}
                                    </Badge>
                                    <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                                        Capacity {formatScore(member.periodSummary?.avgCapacity ?? member.overallAvgCapacity)}
                                    </Badge>
                                    {member.lastCheckin?.needsSupport && (
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Needs support
                                        </Badge>
                                    )}
                                    {member.periodSummary?.submissions > 0 && (
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Activity className="w-3 h-3" /> {member.periodSummary.submissions} in period
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenModal(member)}
                                        className="flex items-center gap-1"
                                    >
                                        Quick view <ArrowUpRight className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() =>
                                            navigate(`/emotional-wellness/${member.id || member._id}`, {
                                                state: { user: member }
                                            })
                                        }
                                    >
                                        Full report
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <UserDetailModal user={detailUser} isOpen={isModalOpen} onClose={handleCloseModal} />
        </>
    );
});

HeadUnitStaffPanel.displayName = 'HeadUnitStaffPanel';
export default HeadUnitStaffPanel;
