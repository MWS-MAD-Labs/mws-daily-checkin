import React, { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Users, Brain } from "lucide-react";
import MoodIcon from "./MoodIcon";
import {
    mapFlaggedUsers,
    PAGE_SIZE,
} from "@/pages/dashboard/components/flagged-users/flaggedUsersUtils";

const FlaggedUsers = memo(({
    users = [],
    title = "Users Needing Support",
    icon: Icon = AlertTriangle,
    userType = "users",
    showMood = true,
    showMetrics = true
}) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => setCurrentPage(1), [users]);

    const transformedUsers = useMemo(() => mapFlaggedUsers(users || []), [users]);

    const totalPages = Math.max(1, Math.ceil(transformedUsers.length / PAGE_SIZE));
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const visibleUsers = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return transformedUsers.slice(start, start + PAGE_SIZE);
    }, [transformedUsers, currentPage]);

    const goToPage = useCallback(
        (page) => setCurrentPage(Math.min(Math.max(1, page), totalPages)),
        [totalPages]
    );

    const showPagination = transformedUsers.length > PAGE_SIZE;
    if (!transformedUsers.length) return null;

    return (
        <div
            className="glass glass-card transition-colors duration-200 border border-border/60"
            data-aos="fade-up"
            data-aos-delay="90"
        >
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 border border-rose-200/80 text-rose-600 dark:text-rose-200 flex items-center justify-center">
                            <Icon className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">{title}</p>
                            <h2 className="text-base md:text-lg font-semibold text-foreground">
                                {userType === "students" ? "Students" : "People"} needing support
                            </h2>
                        </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 border border-rose-200/70 w-fit">
                        {transformedUsers.length}
                    </span>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground">
                    Teacher/Staff/Student that might need you to check-in with them
                </p>

                <div className="space-y-3">
                    {visibleUsers.map((user, index) => (
                        <div
                            key={user.id || user.name}
                            className="rounded-2xl border border-border/70 bg-white/70 dark:bg-slate-900/40 shadow-sm text-sm flex flex-col gap-3 p-3.5 sm:p-4"
                            data-aos="fade-up"
                            data-aos-delay={110 + index * 35}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {showMood && (
                                        <MoodIcon
                                            mood={user.mood}
                                            size="w-6 h-6 flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <button
                                            className="font-semibold text-foreground text-left truncate hover:text-primary/80"
                                            onClick={() => navigate(`/emotional-wellness/${user.raw?.userId || user.id}`)}
                                        >
                                            {user.name}
                                        </button>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user.role} • {user.department || user.grade || "—"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-muted/20 text-muted-foreground">
                                    {user.lastCheckin}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                <div className="rounded-lg bg-rose-50 dark:bg-rose-900/10 px-3 py-1.5">
                                    <span className="font-medium text-foreground">Presence:</span> {user.presenceLevel}/10
                                </div>
                                <div className="rounded-lg bg-sky-50 dark:bg-sky-900/10 px-3 py-1.5">
                                    <span className="font-medium text-foreground">Capacity:</span> {user.capacityLevel}/10
                                </div>
                                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5">
                                    <span className="font-medium text-foreground">Weather:</span> {user.weatherType || "-"}
                                </div>
                            </div>

                            {user.aiReason && (
                                <div className="flex items-start gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/10 border border-blue-200/70 rounded-xl px-3 py-2">
                                    <Brain className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{user.aiReason}</span>
                                </div>
                            )}

                            {showMetrics && user.selectedMoods?.length > 0 && (
                                <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                                    {user.selectedMoods.slice(0, 4).map((moodTag) => (
                                        <span
                                            key={moodTag}
                                            className="px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground"
                                        >
                                            {moodTag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {showPagination && (
                    <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary disabled:opacity-50 transition"
                        >
                            Previous
                        </button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <button
                            type="button"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary disabled:opacity-50 transition"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
});

FlaggedUsers.displayName = "FlaggedUsers";

const FlaggedStudents = memo((props) => (
    <FlaggedUsers
        {...props}
        title="Students Needing Support"
        userType="students"
        icon={Users}
    />
));
FlaggedStudents.displayName = "FlaggedStudents";

export default FlaggedUsers;
export { FlaggedStudents };
