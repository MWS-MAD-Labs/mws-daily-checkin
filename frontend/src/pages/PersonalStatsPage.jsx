import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getCheckinHistory } from "../store/slices/checkinSlice";
import socketService from "../services/socketService";
import { normalizeId } from "../utils/id";
import DataLoader from "@/components/DataLoader";

const PersonalStatsPage = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const dispatch = useDispatch();
    const { user: currentUser } = useSelector((state) => state.auth);
    const { checkinHistory, loading } = useSelector((state) => state.checkin);
    const [initialLoad, setInitialLoad] = useState(true);

    // Use userId from URL params if available, otherwise use current user
    const targetUserId = useMemo(() => {
        return normalizeId(userId) || normalizeId(currentUser) || normalizeId(currentUser?.id) || normalizeId(currentUser?._id);
    }, [userId, currentUser]);

    const userCheckins = useMemo(() => {
        if (!checkinHistory || !targetUserId) return [];
        // Handle both array and object response formats
        const data = Array.isArray(checkinHistory) ? checkinHistory : checkinHistory.data?.checkins || checkinHistory.checkins || [];
        return data.filter(checkin => normalizeId(checkin.userId) === targetUserId);
    }, [checkinHistory, targetUserId]);

    // Debug logging
    console.log('PersonalStatsPage Debug:', {
        currentUser: normalizeId(currentUser),
        targetUserId,
        checkinHistoryLength: checkinHistory?.data?.checkins?.length || checkinHistory?.length || 0,
        userCheckinsLength: userCheckins.length,
        checkinHistoryKeys: checkinHistory ? Object.keys(checkinHistory) : [],
        firstCheckin: userCheckins[0]
    });

    const weeklyTrends = useMemo(() => {
        if (userCheckins.length === 0) return null;

        const last7Days = userCheckins.slice(0, 7);
        const avgPresence = last7Days.reduce((sum, c) => sum + c.presenceLevel, 0) / last7Days.length;
        const avgCapacity = last7Days.reduce((sum, c) => sum + c.capacityLevel, 0) / last7Days.length;

        const moodFrequency = {};
        last7Days.forEach(checkin => {
            checkin.selectedMoods?.forEach(mood => {
                moodFrequency[mood] = (moodFrequency[mood] || 0) + 1;
            });
        });

        const topMoods = Object.entries(moodFrequency)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        return {
            avgPresence: Math.round(avgPresence * 10) / 10,
            avgCapacity: Math.round(avgCapacity * 10) / 10,
            topMoods,
            checkinCount: last7Days.length,
            trend: avgPresence > 6 ? 'improving' : avgPresence < 4 ? 'concerning' : 'stable'
        };
    }, [userCheckins]);

    // Load data and set up real-time updates
    useEffect(() => {
        if (currentUser && targetUserId) {
            const fetchData = async () => {
                await dispatch(getCheckinHistory({ page: 1, limit: 50, userId: targetUserId }));
                setInitialLoad(false);
            };

            fetchData();

            // Connect to socket for real-time updates
            socketService.connect();
            socketService.joinPersonal(targetUserId);

            // Set up real-time listeners
            const handleNewCheckin = (checkinData) => {
                console.log('Real-time personal check-in update:', checkinData);
                // Refresh check-in history
                dispatch(getCheckinHistory({ page: 1, limit: 50, userId: targetUserId }));
            };

            socketService.onPersonalNewCheckin(handleNewCheckin);

            // Cleanup on unmount
            return () => {
                socketService.offPersonalNewCheckin(handleNewCheckin);
                socketService.leavePersonal();
            };
        }
    }, [dispatch, currentUser, targetUserId]);

    const container = useMemo(
        () => ({ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } }),
        []
    );
    const item = useMemo(() => ({ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.32 } } }), []);

    // Show loader during initial data fetch
    if (loading && initialLoad) {
        return (
            <>
                <Helmet>
                    <title>Personal Stats — MWS APP</title>
                </Helmet>
                <DataLoader message="Loading personal statistics..." fullScreen={true} />
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Personal Stats — MWS APP</title>
            </Helmet>

            <motion.main initial="hidden" animate="show" variants={container} className="relative min-h-dvh w-full px-4 pb-12 pt-6">
                <div className="mx-auto max-w-md">
                    {/* header */}
                    <motion.header variants={item} className="mb-6 flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/40 backdrop-blur-md hover:bg-accent/8 transition-colors duration-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold text-foreground">Personal Stats</h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">Summary of your emotional wellness</p>
                        </div>
                    </motion.header>

                    {/* Stats Overview */}
                    <motion.section variants={item}>
                        <Card className="glass glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    My Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">
                                            {userCheckins.length}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total check-ins</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-green-600">
                                            {weeklyTrends?.avgPresence || 'N/A'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Average Presence (7d)</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">
                                            {weeklyTrends?.avgCapacity || 'N/A'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Average Capacity (7d)</div>
                                    </div>
                                </div>

                                {weeklyTrends && (
                                    <div className="mt-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp className="w-4 h-4" />
                                            <span className="font-medium">Weekly Trends:</span>
                                            <Badge variant={
                                                weeklyTrends.trend === 'improving' ? 'default' :
                                                    weeklyTrends.trend === 'concerning' ? 'destructive' : 'secondary'
                                            }>
                                                {weeklyTrends.trend === 'improving' ? 'Improving' :
                                                    weeklyTrends.trend === 'concerning' ? 'Needs Attention' : 'Stable'}
                                            </Badge>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>Presence Level</span>
                                                    <span>{weeklyTrends.avgPresence}/10</span>
                                                </div>
                                                <Progress value={weeklyTrends.avgPresence * 10} className="h-3" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>Capacity Level</span>
                                                    <span>{weeklyTrends.avgCapacity}/10</span>
                                                </div>
                                                <Progress value={weeklyTrends.avgCapacity * 10} className="h-3" />
                                            </div>
                                        </div>

                                        {weeklyTrends.topMoods.length > 0 && (
                                            <div className="mt-6">
                                                <span className="font-medium text-sm">Most Common Moods (7 days):</span>
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {weeklyTrends.topMoods.map(([mood, count]) => (
                                                        <Badge key={mood} variant="outline" className="text-sm">
                                                            {mood} ({count})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.section>

                    {/* Monthly Overview */}
                    <motion.section variants={item} className="mt-6">
                        <Card className="glass glass-card">
                            <CardHeader>
                                <CardTitle>Monthly Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-secondary/20 rounded-lg">
                                            <div className="text-2xl font-bold text-primary">
                                                {userCheckins.filter(c => {
                                                    const checkinDate = new Date(c.date);
                                                    const now = new Date();
                                                    return checkinDate.getMonth() === now.getMonth() &&
                                                        checkinDate.getFullYear() === now.getFullYear();
                                                }).length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">Check-ins This Month</div>
                                        </div>
                                        <div className="text-center p-4 bg-secondary/20 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {userCheckins.filter(c => c.presenceLevel >= 7).length}
                                            </div>
                                            <div className="text-xs text-muted-foreground">High Presence Days</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.section>
                </div>
            </motion.main>
        </>
    );
};

export default PersonalStatsPage;
