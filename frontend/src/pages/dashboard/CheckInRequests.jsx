import React, { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, User } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeFlaggedUser } from "../../store/slices/dashboardSlice";
import { toast } from "../../components/ui/use-toast";
import CheckInRequestPagination from "@/pages/dashboard/components/checkin-requests/CheckInRequestPagination";
import {
    normalizeRequestStatus,
    PAGE_SIZE,
    STATUS_BADGES,
} from "@/pages/dashboard/components/checkin-requests/checkinRequestUtils";

const CheckInRequests = memo(({ requests = [], isHeadUnit }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [processingRequests, setProcessingRequests] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [requests]);

    const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const visibleRequests = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return requests.slice(start, start + PAGE_SIZE);
    }, [requests, currentPage]);

    const goToPage = useCallback((page) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    }, [totalPages]);

    const showPagination = requests.length > PAGE_SIZE;

    const handleConfirmAction = async (requestId, action) => {
        if (processingRequests.has(requestId)) return;
        setProcessingRequests((prev) => new Set(prev).add(requestId));
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast({
                title: "Action Confirmed",
                description: `Check-in request has been ${action === "handled" ? "handled" : "acknowledged"}.`,
            });
            if (action === "handled") {
                dispatch(removeFlaggedUser(requestId));
            }
        } catch (error) {
            console.error("Error confirming action:", error);
            toast({
                title: "Error",
                description: "Failed to confirm action. Please try again.",
                variant: "destructive",
            });
        } finally {
            setProcessingRequests((prev) => {
                const next = new Set(prev);
                next.delete(requestId);
                return next;
            });
        }
    };

    if (!requests || requests.length === 0) return null;

    return (
        <div
            className="glass glass-card transition-colors duration-200 border border-border/60"
            data-aos="fade-up"
            data-aos-delay="50"
        >
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                            <MessageCircle className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                                Check-in Requests
                            </p>
                            <h2 className="text-base md:text-lg font-semibold text-foreground">Mentor follow-ups</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {requests.length} {requests.length === 1 ? "request" : "requests"}
                        </span>
                    </div>
                </div>

                <p className="text-xs md:text-sm text-muted-foreground">
                    {isHeadUnit
                        ? "Unit members who selected you as their support contact."
                        : "Teacher/Staff/Student automatically created when someone requested to be checked-in with you."}
                </p>

                <div className="space-y-3">
                    {visibleRequests.map((request, index) => {
                        const status = normalizeRequestStatus(request.status);
                        const badgeClass = STATUS_BADGES[status] || STATUS_BADGES.requested;

                        return (
                            <div
                                key={index}
                                className="rounded-2xl border border-border/70 bg-white/70 dark:bg-slate-900/40 shadow-sm text-sm transition-colors duration-200"
                                data-aos="fade-up"
                                data-aos-delay={90 + index * 30}
                            >
                                <div className="flex flex-col gap-3 p-3.5 sm:p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                                                <User className="w-4 h-4" aria-hidden="true" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{request.contact}</span>
                                                <button
                                                    onClick={() => navigate(`/emotional-wellness/${request.userId}`)}
                                                    className="text-xs text-muted-foreground text-left hover:text-primary/80"
                                                >
                                                    by {request.requestedBy}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                                                {status}
                                            </span>
                                            {request.status !== "handled" && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConfirmAction(request.id, "acknowledged");
                                                        }}
                                                        disabled={processingRequests.has(request.id)}
                                                        className="px-2.5 py-1 text-[11px] rounded-full border border-sky-200 text-sky-700 bg-sky-50 dark:bg-sky-900/10 hover:bg-sky-100 transition disabled:opacity-50"
                                                    >
                                                        Acknowledge
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConfirmAction(request.id, "handled");
                                                        }}
                                                        disabled={processingRequests.has(request.id)}
                                                        className="px-2.5 py-1 text-[11px] rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 transition disabled:opacity-50"
                                                    >
                                                        Handled
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                        <div className="rounded-lg bg-muted/10 px-3 py-1.5">
                                            <span className="font-medium text-foreground">Weather:</span> {request.weatherType || "-"}
                                        </div>
                                        <div className="rounded-lg bg-muted/10 px-3 py-1.5">
                                            <span className="font-medium text-foreground">Presence:</span> {request.presenceLevel}/10
                                        </div>
                                        <div className="rounded-lg bg-muted/10 px-3 py-1.5">
                                            <span className="font-medium text-foreground">Capacity:</span> {request.capacityLevel}/10
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {showPagination && (
                    <CheckInRequestPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                    />
                )}
            </div>
        </div>
    );
});

CheckInRequests.displayName = "CheckInRequests";
export default CheckInRequests;
