import React, { memo, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { Calendar, Users, ChevronDown, ChevronUp } from "lucide-react";
import { fetchUserCheckinHistory } from "../../../store/slices/dashboardSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    HISTORY_LIMIT,
    formatHistoryDate,
    weatherIcon,
} from "@/pages/dashboard/components/user-history/userHistoryUtils";
import {
    UserHistoryEmptyState,
    UserHistoryLoadingState,
} from "@/pages/dashboard/components/user-history/UserHistoryStateViews";

const UserHistorySection = memo(function UserHistorySection({ userId }) {
    const dispatch = useDispatch();
    const { userCheckinHistory, loading } = useSelector((state) => state.dashboard);
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [currentOffset, setCurrentOffset] = useState(0);

    useEffect(() => {
        if (userId) {
            dispatch(fetchUserCheckinHistory({ userId, limit: HISTORY_LIMIT, offset: currentOffset }));
        }
    }, [dispatch, userId, currentOffset]);

    const toggleExpanded = useCallback((id) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const loadMore = useCallback(() => {
        if (userCheckinHistory?.pagination?.hasMore) {
            setCurrentOffset((prev) => prev + HISTORY_LIMIT);
        }
    }, [userCheckinHistory?.pagination?.hasMore]);

    if (loading && !userCheckinHistory) return <UserHistoryLoadingState />;
    if (!userCheckinHistory?.checkins?.length) return <UserHistoryEmptyState />;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Check-in History
                    <Badge variant="secondary" className="ml-auto">
                        {userCheckinHistory.pagination.total} total
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {userCheckinHistory.checkins.map((checkin, index) => (
                        <motion.div
                            key={checkin.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{weatherIcon(checkin.weatherType)}</span>
                                    <div>
                                        <p className="font-medium text-sm">{formatHistoryDate(checkin.date)}</p>
                                        <p className="text-xs text-muted-foreground">Submitted {formatHistoryDate(checkin.submittedAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">P: {checkin.presenceLevel}/10</Badge>
                                    <Badge variant="outline" className="text-xs">C: {checkin.capacityLevel}/10</Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleExpanded(checkin.id)}
                                        className="h-6 w-6 p-0"
                                    >
                                        {expandedItems.has(checkin.id)
                                            ? <ChevronUp className="w-4 h-4" />
                                            : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-2">
                                {checkin.selectedMoods.map((mood, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">{mood}</Badge>
                                ))}
                            </div>

                            {expandedItems.has(checkin.id) && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 pt-3 border-t space-y-2"
                                >
                                    {checkin.details && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Details:</p>
                                            <p className="text-sm text-muted-foreground">{checkin.details}</p>
                                        </div>
                                    )}

                                    {checkin.aiAnalysis && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">AI Analysis:</p>
                                            <div className="text-sm text-muted-foreground">
                                                {checkin.aiAnalysis.emotionalState && <p>Emotional State: {checkin.aiAnalysis.emotionalState}</p>}
                                                {checkin.aiAnalysis.needsSupport && <p className="text-amber-600">⚠️ Support needed</p>}
                                            </div>
                                        </div>
                                    )}

                                    {checkin.supportContact && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="w-4 h-4" />
                                            <span>Support Contact: {checkin.supportContact.name}</span>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {userCheckinHistory?.pagination?.hasMore && (
                    <div className="mt-6 text-center">
                        <Button onClick={loadMore} disabled={loading} variant="outline">
                            {loading ? "Loading..." : "Load More"}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

UserHistorySection.displayName = "UserHistorySection";

export default UserHistorySection;
