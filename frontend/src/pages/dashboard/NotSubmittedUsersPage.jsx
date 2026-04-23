import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Target, AlertCircle, Search, Clock } from "lucide-react";
import { fetchDashboardStats } from "@/store/slices/dashboardSlice";
import { buildParticipationSnapshot, formatNumber } from "./utils/analyticsHelpers";

const PERIOD_LABELS = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    semester: "This Semester",
    all: "Across All Time"
};

const NotSubmittedUsersPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { stats, loading, selectedPeriod } = useSelector((state) => state.dashboard);

    const [searchQuery, setSearchQuery] = useState("");
    const [unitFilter, setUnitFilter] = useState("all");

    const snapshotFromState = location.state?.snapshot;

    useEffect(() => {
        if (!stats && !snapshotFromState) {
            dispatch(fetchDashboardStats({ period: selectedPeriod || "today" }));
        }
    }, [dispatch, stats, snapshotFromState, selectedPeriod]);

    const snapshot = useMemo(() => {
        if (snapshotFromState) {
            return {
                ...snapshotFromState,
                period: snapshotFromState.period || selectedPeriod || "today",
                notSubmittedUsers: snapshotFromState.notSubmittedUsers || []
            };
        }
        return buildParticipationSnapshot(stats, selectedPeriod);
    }, [snapshotFromState, stats, selectedPeriod]);

    const notSubmittedUsers = snapshot?.notSubmittedUsers || [];
    const units = useMemo(() => {
        const set = new Set();
        notSubmittedUsers.forEach((user) => {
            const token = user.unit || user.department;
            if (token) set.add(String(token));
        });
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [notSubmittedUsers]);

    const filteredUsers = useMemo(() => {
        if (!notSubmittedUsers.length) return [];
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return notSubmittedUsers.filter((user) => {
            if (unitFilter !== "all") {
                const unitMatch = (user.unit || user.department || "").toLowerCase();
                if (unitMatch !== unitFilter.toLowerCase()) return false;
            }

            if (!normalizedQuery) return true;

            return [
                user.name,
                user.email,
                user.role,
                user.jobPosition,
                user.department,
                user.unit,
                user.grade,
                user.username
            ].some((field) => typeof field === "string" && field.toLowerCase().includes(normalizedQuery));
        });
    }, [notSubmittedUsers, searchQuery, unitFilter]);

    const activePeriodLabel = PERIOD_LABELS[snapshot?.period] || "Selected Period";
    const outstandingCount = snapshot?.notSubmittedCount || notSubmittedUsers.length;

    const handleBack = () => {
        navigate("/emotional-checkin/dashboard");
    };

    if (!snapshot && loading) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="glass glass-card p-6 text-center space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">Loading participation insights…</p>
                    <p className="text-xs text-muted-foreground">We’re preparing the latest dashboard data.</p>
                </div>
            </div>
        );
    }

    if (!snapshot) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="glass glass-card p-6 text-center space-y-3">
                    <p className="text-sm text-muted-foreground">We couldn’t load the participation data.</p>
                    <button
                        type="button"
                        onClick={() => dispatch(fetchDashboardStats({ period: selectedPeriod || "today", force: true }))}
                        className="inline-flex items-center justify-center rounded-md bg-primary/90 text-white px-4 py-2 text-sm font-medium hover:bg-primary transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-foreground relative overflow-hidden">
            <div className="relative z-10 container-tight py-6">
                <div className="flex flex-col gap-4" data-aos="fade-up">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to dashboard
                    </button>

                    <div className="glass glass-card p-5 space-y-3">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">{activePeriodLabel}</p>
                                <h1 className="text-2xl md:text-3xl font-semibold">Participation follow-up</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {outstandingCount > 0
                                        ? `${outstandingCount} people still need an emotional check-in.`
                                        : "Everyone has submitted their check-in for this period."}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Normalized across {snapshot.workdayCount === 1 ? "today" : `${snapshot.workdayCount} workdays`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
                    {[
                        {
                            label: "Participation rate",
                            value: `${snapshot.participationRate ?? 0}%`,
                            description: `${formatNumber(snapshot.totalCheckins)} submissions so far`,
                            icon: Target
                        },
                        {
                            label: "Expected submissions",
                            value: formatNumber(snapshot.expectedSubmissions || 0),
                            description: `${formatNumber(snapshot.totalUsers || 0)} people × ${snapshot.workdayCount} workdays`,
                            icon: Clock
                        },
                        {
                            label: "Missing submissions",
                            value: formatNumber(outstandingCount || 0),
                            description: "People to follow up with",
                            icon: AlertCircle
                        },
                        {
                            label: "Team in scope",
                            value: formatNumber(snapshot.totalUsers || 0),
                            description: "Employees in this dashboard view",
                            icon: Users
                        }
                    ].map((card, index) => (
                        <div
                            key={card.label}
                            className="glass glass-card p-4 border border-border/60 flex flex-col gap-2"
                            data-aos="fade-up"
                            data-aos-delay={100 + index * 60}
                        >
                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wide">
                                <card.icon className="w-4 h-4 text-primary" />
                                {card.label}
                            </div>
                            <p className="text-2xl font-semibold text-foreground">{card.value}</p>
                            <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                    ))}
                </div>

                <div className="glass glass-card mt-6 p-5" data-aos="fade-up" data-aos-delay="150">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                        <div>
                            <h2 className="text-lg font-semibold">Who still needs to submit?</h2>
                            <p className="text-sm text-muted-foreground">
                                Showing {filteredUsers.length} of {notSubmittedUsers.length} people without a check-in.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 min-w-[220px]">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by name, role, or unit"
                                    value={searchQuery}
                                    onChange={(event) => setSearchQuery(event.target.value)}
                                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                            {units.length > 0 && (
                                <select
                                    value={unitFilter}
                                    onChange={(event) => setUnitFilter(event.target.value)}
                                    className="w-full sm:w-56 rounded-lg border border-border bg-background/80 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                    <option value="all">All units & departments</option>
                                    {units.map((unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    {filteredUsers.length === 0 ? (
                        <div className="p-6 rounded-lg border border-dashed border-muted flex flex-col items-center text-center gap-2" data-aos="fade-up">
                            <AlertCircle className="w-8 h-8 text-amber-500" />
                            <p className="text-sm font-medium text-foreground">No outstanding submissions</p>
                            <p className="text-xs text-muted-foreground">
                                Everyone has submitted their emotional check-in for this filter set.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map((user, index) => {
                                const chips = [
                                    user.jobPosition,
                                    user.role,
                                    user.unit,
                                    user.department,
                                    user.grade,
                                    user.classes?.[0]
                                ].filter((value, idx, arr) => Boolean(value) && arr.indexOf(value) === idx);

                                return (
                                    <div
                                        key={user._id || user.id || user.email || `${user.name}-${index}`}
                                        className="p-4 rounded-xl border border-border/70 bg-card/40 backdrop-blur-sm"
                                        data-aos="fade-up"
                                        data-aos-delay={180 + index * 20}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                            <div>
                                                <p className="text-base font-semibold text-foreground">{user.name || user.username || "Unnamed user"}</p>
                                                <p className="text-sm text-muted-foreground">{user.email || "No email on record"}</p>
                                                {chips.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {chips.map((chip) => (
                                                            <span
                                                                key={chip}
                                                                className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                                                            >
                                                                {chip}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {user.lastCheckinDate && (
                                                <div className="text-right text-xs text-muted-foreground">
                                                    <p>Last check-in</p>
                                                    <p className="font-medium text-foreground">
                                                        {new Date(user.lastCheckinDate).toLocaleDateString("en-US", {
                                                            month: "short",
                                                            day: "numeric"
                                                        })}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotSubmittedUsersPage;
