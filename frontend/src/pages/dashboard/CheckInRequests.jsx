import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, MessageCircle, User, Users } from "lucide-react";
import { useDispatch } from "react-redux";
import { removeFlaggedUser } from "../../store/slices/dashboardSlice";
import { toast } from "../../components/ui/use-toast";
import { confirmSupportRequest } from "../../services/dashboardService";
import CheckInRequestPagination from "@/pages/dashboard/components/checkin-requests/CheckInRequestPagination";
import {
    isTerminalStatus,
    normalizeRequestStatus,
    PAGE_SIZE,
    STATUS_BADGES,
    STATUS_LABELS,
} from "@/pages/dashboard/components/checkin-requests/checkinRequestUtils";

// ─── Resolution modal ────────────────────────────────────────────────────────

const ResolveModal = ({ request, onClose, onSubmit, processing }) => {
    const [message, setMessage] = useState("");
    const isValid = message.trim().length >= 10;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-xl w-full max-w-md">
                <div className="p-5 border-b border-border">
                    <h3 className="font-semibold text-foreground">Mark as Resolved</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                        Support request from <strong>{request.requestedBy}</strong>
                    </p>
                </div>
                <div className="p-5 space-y-3">
                    <label className="text-xs font-medium text-foreground block">
                        What did you do to resolve this?{" "}
                        <span className="text-destructive">*</span>
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe the follow-up action taken (e.g., met with the person, discussed concerns, referred to counselor…)"
                        maxLength={500}
                        rows={4}
                        className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                        {message.length}/500
                    </p>
                    {message.length > 0 && !isValid && (
                        <p className="text-xs text-destructive">Minimum 10 characters required.</p>
                    )}
                </div>
                <div className="p-5 border-t border-border flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={processing}
                        className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(message.trim())}
                        disabled={!isValid || processing}
                        className="px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {processing ? (
                            <span>Saving…</span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark as Resolved</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main component ──────────────────────────────────────────────────────────

const CheckInRequests = memo(({ requests = [], isHeadUnit, onRequestUpdated, focusedRequestId, onRequestFocusHandled }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [processingIds, setProcessingIds] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [resolveModal, setResolveModal] = useState(null); // { request } | null
    const [highlightedRequestId, setHighlightedRequestId] = useState(null);

    useEffect(() => { setCurrentPage(1); }, [requests]);

    const totalPages = Math.max(1, Math.ceil(requests.length / PAGE_SIZE));
    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const visibleRequests = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return requests.slice(start, start + PAGE_SIZE);
    }, [requests, currentPage]);

    const normalizedFocusedRequestId = focusedRequestId?.toString?.() || "";

    useEffect(() => {
        if (!normalizedFocusedRequestId) return;

        const requestIndex = requests.findIndex(
            (request) => request?.id?.toString?.() === normalizedFocusedRequestId
        );

        if (requestIndex < 0) {
            onRequestFocusHandled?.();
            return;
        }

        const targetPage = Math.floor(requestIndex / PAGE_SIZE) + 1;
        if (targetPage !== currentPage) {
            setCurrentPage(targetPage);
        }
    }, [currentPage, normalizedFocusedRequestId, onRequestFocusHandled, requests]);

    useEffect(() => {
        if (!normalizedFocusedRequestId) return;

        const isVisible = visibleRequests.some(
            (request) => request?.id?.toString?.() === normalizedFocusedRequestId
        );
        if (!isVisible) return;

        setHighlightedRequestId(normalizedFocusedRequestId);

        const frameId = window.requestAnimationFrame(() => {
            document
                .querySelector(`[data-checkin-request-id="${normalizedFocusedRequestId}"]`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        const timerId = window.setTimeout(() => {
            setHighlightedRequestId((current) => (
                current === normalizedFocusedRequestId ? null : current
            ));
            onRequestFocusHandled?.();
        }, 3600);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.clearTimeout(timerId);
        };
    }, [normalizedFocusedRequestId, onRequestFocusHandled, visibleRequests]);

    const goToPage = useCallback((page) => {
        setCurrentPage(Math.min(Math.max(1, page), totalPages));
    }, [totalPages]);

    const setProcessing = (id, val) =>
        setProcessingIds((prev) => {
            const next = new Set(prev);
            val ? next.add(id) : next.delete(id);
            return next;
        });

    const handleAction = useCallback(async (request, action, resolutionMessage) => {
        const id = request.id;
        if (processingIds.has(id)) return;
        setProcessing(id, true);

        try {
            const payload = {};
            if (resolutionMessage) payload.resolutionMessage = resolutionMessage;

            await confirmSupportRequest(id, action, payload);

            const label =
                action === "success"   ? "Marked as resolved"      :
                action === "follow_up" ? "Follow-up status updated" :
                                         "Acknowledged";

            toast({ title: "Updated", description: label });

            if (action === "success" || action === "handled") {
                dispatch(removeFlaggedUser(id));
            }
            if (typeof onRequestUpdated === "function") onRequestUpdated();
        } catch (error) {
            console.error("confirmSupportRequest error:", error);
            toast({
                title: "Error",
                description: error?.response?.data?.message || "Failed to update. Please try again.",
                variant: "destructive",
            });
        } finally {
            setProcessing(id, false);
        }
    }, [processingIds, dispatch, onRequestUpdated]);

    const openResolveModal = useCallback((request) => setResolveModal({ request }), []);
    const closeResolveModal = useCallback(() => setResolveModal(null), []);

    const handleResolveSubmit = useCallback(async (message) => {
        if (!resolveModal) return;
        await handleAction(resolveModal.request, "success", message);
        setResolveModal(null);
    }, [resolveModal, handleAction]);

    if (!requests || requests.length === 0) return null;

    return (
        <>
            {resolveModal && (
                <ResolveModal
                    request={resolveModal.request}
                    onClose={closeResolveModal}
                    onSubmit={handleResolveSubmit}
                    processing={processingIds.has(resolveModal.request.id)}
                />
            )}

            <div
                className="glass glass-card transition-colors duration-200 border border-border/60"
                data-aos="fade-up"
                data-aos-delay="50"
            >
                <div className="glass__refract" />
                <div className="glass__noise" />

                <div className="relative z-10 p-4 md:p-6 space-y-5">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                                    Check-in Requests
                                </p>
                                <h2 className="text-base md:text-lg font-semibold text-foreground">
                                    Mentor follow-ups
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                {requests.length}{" "}
                                {requests.length === 1 ? "request" : "requests"}
                            </span>
                        </div>
                    </div>

                    <p className="text-xs md:text-sm text-muted-foreground">
                        {isHeadUnit
                            ? "Unit members who selected you as their support contact."
                            : "Automatically created when someone requested to be checked-in with you."}
                    </p>

                    {/* Request cards */}
                    <div className="space-y-3">
                        {visibleRequests.map((request, index) => {
                            const status = normalizeRequestStatus(request.status);
                            const badgeClass = STATUS_BADGES[status] || STATUS_BADGES.requested;
                            const statusLabel = STATUS_LABELS[status] || "Needs Follow-up";
                            const terminal = isTerminalStatus(status);
                            const processing = processingIds.has(request.id);

                            return (
                                <div
                                    key={request.id || index}
                                    data-checkin-request-id={request.id}
                                    className={`rounded-2xl border bg-white/70 dark:bg-slate-900/40 shadow-sm text-sm transition-all duration-300 ${
                                        highlightedRequestId === request.id?.toString?.()
                                            ? "border-primary/70 ring-4 ring-primary/20 shadow-lg shadow-primary/10"
                                            : "border-border/70"
                                    }`}
                                    data-aos="fade-up"
                                    data-aos-delay={90 + index * 30}
                                >
                                    <div className="flex flex-col gap-3 p-3.5 sm:p-4">
                                        {/* Top row: name + status + actions */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center text-primary">
                                                    <User className="w-4 h-4" aria-hidden="true" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">
                                                        {request.contact}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/emotional-wellness/${request.userId}`, {
                                                                state: {
                                                                    user: {
                                                                        id: request.userId,
                                                                        name: request.requestedBy,
                                                                        email: request.email,
                                                                    },
                                                                    fromDashboard: true
                                                                }
                                                            })
                                                        }
                                                        className="text-xs text-muted-foreground text-left hover:text-primary/80"
                                                    >
                                                        by {request.requestedBy}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
                                                <span
                                                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}
                                                >
                                                    {statusLabel}
                                                </span>

                                                {/* Action buttons — hidden for terminal statuses */}
                                                {!terminal && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {/* Acknowledge — only from pending */}
                                                        {status === "requested" && (
                                                            <button
                                                                onClick={() =>
                                                                    handleAction(request, "acknowledged")
                                                                }
                                                                disabled={processing}
                                                                className="px-2.5 py-1 text-[11px] rounded-full border border-sky-200 text-sky-700 bg-sky-50 dark:bg-sky-900/10 hover:bg-sky-100 transition disabled:opacity-50"
                                                            >
                                                                Acknowledge
                                                            </button>
                                                        )}

                                                        {/* Follow Up — from pending or acknowledged */}
                                                        {(status === "requested" ||
                                                            status === "acknowledged") && (
                                                            <button
                                                                onClick={() =>
                                                                    handleAction(request, "follow_up")
                                                                }
                                                                disabled={processing}
                                                                className="px-2.5 py-1 text-[11px] rounded-full border border-violet-200 text-violet-700 bg-violet-50 dark:bg-violet-900/10 hover:bg-violet-100 transition disabled:opacity-50 flex items-center gap-1"
                                                            >
                                                                <Users className="w-3 h-3" />
                                                                Follow Up
                                                            </button>
                                                        )}

                                                        {/* Mark as Resolved — always shown while not terminal */}
                                                        <button
                                                            onClick={() => openResolveModal(request)}
                                                            disabled={processing}
                                                            className="px-2.5 py-1 text-[11px] rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 transition disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Mark as Resolved
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Processing spinner */}
                                                {processing && (
                                                    <span className="text-[11px] text-muted-foreground">
                                                        Saving…
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats row */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                            <div className="rounded-lg bg-muted/10 px-3 py-1.5">
                                                <span className="font-medium text-foreground">
                                                    Weather:
                                                </span>{" "}
                                                {request.weatherType || "—"}
                                            </div>
                                            <div className="rounded-lg bg-muted/10 px-3 py-1.5">
                                                <span className="font-medium text-foreground">
                                                    Presence:
                                                </span>{" "}
                                                {request.presenceLevel}/10
                                            </div>
                                            <div className="rounded-lg bg-muted/10 px-3 py-1.5">
                                                <span className="font-medium text-foreground">
                                                    Capacity:
                                                </span>{" "}
                                                {request.capacityLevel}/10
                                            </div>
                                        </div>

                                        {/* Resolution message — shown when resolved */}
                                        {terminal && request.resolutionMessage && (
                                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/60 px-3 py-2.5 flex gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                                                        Resolution note
                                                    </p>
                                                    <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                                        {request.resolutionMessage}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {requests.length > PAGE_SIZE && (
                        <CheckInRequestPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={goToPage}
                        />
                    )}
                </div>
            </div>
        </>
    );
});

CheckInRequests.displayName = "CheckInRequests";
export default CheckInRequests;
