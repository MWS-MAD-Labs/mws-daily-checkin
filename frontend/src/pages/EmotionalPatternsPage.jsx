import React, { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { ArrowLeft, Activity, Heart, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCheckinHistory } from "../store/slices/checkinSlice";
import socketService from "../services/socketService";
import { normalizeId } from "../utils/id";
import DataLoader from "@/components/DataLoader";

const EmotionalPatternsPage = () => {
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
    console.log('EmotionalPatternsPage Debug:', {
        currentUser: normalizeId(currentUser),
        targetUserId,
        checkinHistoryLength: checkinHistory?.data?.checkins?.length || checkinHistory?.length || 0,
        userCheckinsLength: userCheckins.length,
        checkinHistoryKeys: checkinHistory ? Object.keys(checkinHistory) : [],
        firstCheckin: userCheckins[0]
    });

    const patterns = useMemo(() => {
        if (userCheckins.length === 0) return null;

        // Weather patterns
        const weatherCount = userCheckins.reduce((acc, checkin) => {
            acc[checkin.weatherType] = (acc[checkin.weatherType] || 0) + 1;
            return acc;
        }, {});

        const weatherPatterns = Object.entries(weatherCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);

        // Mood patterns
        const moodCount = {};
        userCheckins.forEach(checkin => {
            checkin.selectedMoods?.forEach(mood => {
                moodCount[mood] = (moodCount[mood] || 0) + 1;
            });
        });

        const moodPatterns = Object.entries(moodCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);

        // Challenge patterns
        const lowCapacityDays = userCheckins.filter(c => c.capacityLevel < 5).length;
        const lowPresenceDays = userCheckins.filter(c => c.presenceLevel < 5).length;
        const highCapacityDays = userCheckins.filter(c => c.capacityLevel >= 8).length;
        const highPresenceDays = userCheckins.filter(c => c.presenceLevel >= 8).length;

        // Weekly patterns
        const weeklyData = userCheckins.slice(0, 28); // Last 4 weeks
        const weeklyAvg = weeklyData.length > 0 ? {
            presence: weeklyData.reduce((sum, c) => sum + c.presenceLevel, 0) / weeklyData.length,
            capacity: weeklyData.reduce((sum, c) => sum + c.capacityLevel, 0) / weeklyData.length
        } : null;

        return {
            weatherPatterns,
            moodPatterns,
            challenges: {
                lowCapacityDays,
                lowPresenceDays,
                highCapacityDays,
                highPresenceDays
            },
            weeklyAvg,
            totalCheckins: userCheckins.length
        };
    }, [userCheckins]);

    const insights = useMemo(() => {
        if (!patterns) return null;

        const { challenges, weeklyAvg, totalCheckins, weatherPatterns, moodPatterns } = patterns;
        let insights = [];

        if (totalCheckins > 0) {
            // Advanced AI Analysis
            const userName = currentUser?.name || 'You';

            // 1. Overall engagement analysis
            insights.push(`🎯 ${userName} has completed ${totalCheckins} emotional check-in${totalCheckins > 1 ? 's' : ''} with remarkable consistency. This shows a strong commitment to mental health and self-awareness.`);

            // 2. Advanced trend analysis
            if (weeklyAvg) {
                const presenceScore = weeklyAvg.presence;
                const capacityScore = weeklyAvg.capacity;

                // Presence analysis
                let presenceInsight = '';
                if (presenceScore >= 8) {
                    presenceInsight = `Your mental presence is exceptional (${presenceScore.toFixed(1)}/10) - this shows very high focus and engagement with work and your surroundings.`;
                } else if (presenceScore >= 6) {
                    presenceInsight = `Your presence is stable (${presenceScore.toFixed(1)}/10) with room for improvement. Consider mindfulness techniques to enhance daily focus.`;
                } else if (presenceScore >= 4) {
                    presenceInsight = `Your presence is moderate (${presenceScore.toFixed(1)}/10). This may be related to workload or external factors.`;
                } else {
                    presenceInsight = `Your presence needs special attention (${presenceScore.toFixed(1)}/10). Consider identifying and addressing the factors affecting it.`;
                }
                insights.push(`🧠 ${presenceInsight}`);

                // Capacity analysis
                let capacityInsight = '';
                if (capacityScore >= 8) {
                    capacityInsight = `Your energy capacity is very high (${capacityScore.toFixed(1)}/10) - this shows exceptional mental resilience and ability to handle challenges well.`;
                } else if (capacityScore >= 6) {
                    capacityInsight = `Your capacity is good (${capacityScore.toFixed(1)}/10) with a solid foundation for productivity.`;
                } else if (capacityScore >= 4) {
                    capacityInsight = `Your capacity is moderate (${capacityScore.toFixed(1)}/10). Consider energy management strategies like regular breaks and good nutrition.`;
                } else {
                    capacityInsight = `Your energy capacity needs attention (${capacityScore.toFixed(1)}/10). This may indicate fatigue or need for additional support.`;
                }
                insights.push(`⚡ ${capacityInsight}`);
            }

            // 3. Weather pattern analysis
            if (weatherPatterns && weatherPatterns.length > 0) {
                const dominantWeather = weatherPatterns[0][0];
                const weatherFrequency = ((weatherPatterns[0][1] / totalCheckins) * 100);

                const weatherInsights = {
                    'sunny': `Your emotional weather is dominated by sunny days (${weatherFrequency.toFixed(1)}%), showing consistent optimism and positive energy.`,
                    'light-rain': `You often experience light rain days (${weatherFrequency.toFixed(1)}%), which shows your ability to handle small challenges calmly.`,
                    'rainy': `Rainy weather appears quite often (${weatherFrequency.toFixed(1)}%), indicating periods of deep reflection and emotional processing.`,
                    'thunderstorms': `Emotional storms appear (${weatherFrequency.toFixed(1)}%), showing high emotional intensity and ability to navigate turbulence.`,
                    'windy': `Strong winds often occur (${weatherFrequency.toFixed(1)}%), indicating periods of instability that require grounding.`,
                    'snowy': `Snow covers your emotional landscape (${weatherFrequency.toFixed(1)}%), showing a need for warmth and support.`,
                    'foggy': `Emotional fog is quite thick (${weatherFrequency.toFixed(1)}%), indicating periods of uncertainty that require clarification.`,
                    'cloudy': `Clouds dominate (${weatherFrequency.toFixed(1)}%), showing stable but subdued moods.`
                };

                insights.push(`🌤️ ${weatherInsights[dominantWeather] || `Pola cuaca emosi Anda unik dengan dominasi ${dominantWeather} (${weatherFrequency.toFixed(1)}%).`}`);
            }

            // 4. Mood pattern analysis
            if (moodPatterns && moodPatterns.length > 0) {
                const topMoods = moodPatterns.slice(0, 3);
                const moodAnalysis = topMoods.map(([mood, count]) => {
                    const percentage = ((count / totalCheckins) * 100).toFixed(1);
                    return `${mood} (${percentage}%)`;
                }).join(', ');

                insights.push(`😊 Your mood patterns show a strong tendency towards: ${moodAnalysis}. This reflects your unique personality and emotional responses.`);

                // Advanced mood insights
                const positiveMoods = ['happy', 'excited', 'hopeful', 'calm', 'grateful'];
                const challengingMoods = ['anxious', 'tired', 'lonely', 'sad', 'angry'];

                const positiveCount = moodPatterns.filter(([mood]) => positiveMoods.includes(mood)).reduce((sum, [, count]) => sum + count, 0);
                const challengingCount = moodPatterns.filter(([mood]) => challengingMoods.includes(mood)).reduce((sum, [, count]) => sum + count, 0);

                if (positiveCount > challengingCount * 1.5) {
                    insights.push(`✨ Deep analysis shows you have a strong positive tendency, with a positive emotions vs challenges ratio of ${(positiveCount / challengingCount).toFixed(1)}:1. This is a great strength!`);
                } else if (challengingCount > positiveCount * 1.5) {
                    insights.push(`🔍 Your emotional patterns show significant periods of challenge. This is an opportunity for resilience development and personal growth.`);
                } else {
                    insights.push(`⚖️ Your emotional balance is quite good, with healthy variation between positive experiences and challenges. This shows mature emotional intelligence.`);
                }
            }

            // 5. Challenge analysis with advanced insights
            const totalLowDays = challenges.lowCapacityDays + challenges.lowPresenceDays;
            const totalHighDays = challenges.highCapacityDays + challenges.highPresenceDays;

            if (totalLowDays > totalHighDays) {
                insights.push(`📊 Challenge analysis shows you experience more days with low performance (${totalLowDays} vs ${totalHighDays} high days). This may be related to sleep patterns, nutrition, or workload. Recommendation: Review your daily routine and consider consulting with mental health professionals.`);
            } else if (totalHighDays > totalCheckins * 0.6) {
                insights.push(`🏆 Your emotional performance is outstanding! ${totalHighDays} days with high capacity/presence from ${totalCheckins} total check-ins shows exceptional mental resilience. Continue the practices that support your well-being.`);
            }

            // 6. Predictive insights
            if (totalCheckins >= 7) {
                const recentCheckins = userCheckins.slice(0, 7); // Last 7 days
                const recentAvgPresence = recentCheckins.reduce((sum, c) => sum + c.presenceLevel, 0) / recentCheckins.length;
                const recentAvgCapacity = recentCheckins.reduce((sum, c) => sum + c.capacityLevel, 0) / recentCheckins.length;

                if (recentAvgPresence < weeklyAvg?.presence - 1) {
                    insights.push(`🔮 Prediction: Your presence has decreased in the last week. This may be an early signal for intervention - consider additional rest or relaxation techniques.`);
                } else if (recentAvgCapacity > weeklyAvg?.capacity + 1) {
                    insights.push(`📈 Positive trend detected! Your capacity is increasing. Analysis shows your practices are effective - continue!`);
                }
            }

            // 7. Personalized recommendations
            insights.push(`💡 Personal Recommendation: Based on your unique patterns, focus on ${challenges.lowCapacityDays > challenges.lowPresenceDays ? 'energy management' : 'focus improvement'} to optimize your emotional performance.`);

            // 8. Long-term growth insights
            if (totalCheckins >= 14) {
                insights.push(`🌱 Growth Insight: With ${totalCheckins} check-ins, you have built a solid foundation for mental health. Continue this consistency to see more meaningful long-term patterns.`);
            }
        }

        return insights;
    }, [patterns, currentUser?.name]);

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
                    <title>Pola Emosi — Kerjain</title>
                </Helmet>
                <DataLoader message="Loading emotional patterns..." fullScreen={true} />
            </>
        );
    }

    return (
        <>
            <Helmet>
                <title>Pola Emosi — Kerjain</title>
            </Helmet>

            <motion.main initial="hidden" animate="show" variants={container} className="relative min-h-dvh w-full px-4 pb-12 pt-6">
                <div className="mx-auto max-w-md">
                    {/* header */}
                    <motion.header variants={item} className="mb-6 flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            aria-label="Kembali"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/40 backdrop-blur-md hover:bg-accent/8 transition-colors duration-300"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold text-foreground">Emotional Patterns</h1>
                            <p className="mt-0.5 text-xs text-muted-foreground">Insights & patterns</p>
                        </div>
                    </motion.header>

                    {patterns ? (
                        <>
                            {/* Weather Patterns */}
                            <motion.section variants={item}>
                                <Card className="glass glass-card">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Activity className="w-5 h-5" />
                                            Emotional Weather Patterns
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {patterns.weatherPatterns.map(([weather, count]) => (
                                                <div key={weather} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-foreground border-foreground/30">{weather}</Badge>
                                                        <span className="text-sm text-foreground/80">
                                                            {((count / patterns.totalCheckins) * 100).toFixed(1)}% of total
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-foreground">{count} kali</span>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.section>

                            {/* Mood Patterns */}
                            <motion.section variants={item} className="mt-6">
                                <Card className="glass glass-card">
                                    <CardHeader>
                                        <CardTitle>Mood Patterns</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex flex-wrap gap-2">
                                            {patterns.moodPatterns.map(([mood, count]) => (
                                                <Badge key={mood} variant="secondary" className="text-sm text-foreground bg-secondary/80 border-secondary-foreground/30">
                                                    {mood} ({count})
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.section>

                            {/* Challenge Patterns */}
                            <motion.section variants={item} className="mt-6">
                                <Card className="glass glass-card">
                                    <CardHeader>
                                        <CardTitle>Challenge Patterns</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/30">
                                                <div className="text-xl font-bold text-red-700 dark:text-red-400">
                                                    {patterns.challenges.lowCapacityDays}
                                                </div>
                                                <div className="text-xs text-foreground/70">Low Capacity Days</div>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800/30">
                                                <div className="text-xl font-bold text-orange-700 dark:text-orange-400">
                                                    {patterns.challenges.lowPresenceDays}
                                                </div>
                                                <div className="text-xs text-foreground/70">Low Presence Days</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/30">
                                                <div className="text-xl font-bold text-green-700 dark:text-green-400">
                                                    {patterns.challenges.highCapacityDays}
                                                </div>
                                                <div className="text-xs text-foreground/70">High Capacity Days</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/30">
                                                <div className="text-xl font-bold text-blue-700 dark:text-blue-400">
                                                    {patterns.challenges.highPresenceDays}
                                                </div>
                                                <div className="text-xs text-foreground/70">High Presence Days</div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.section>

                            {/* AI Insights */}
                            <motion.section variants={item} className="mt-6">
                                <Card className="glass glass-card">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5" />
                                            AI Insights
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {insights.map((insight, index) => (
                                                <div key={index} className="flex gap-3">
                                                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                                    <p className="text-sm text-foreground/80">{insight}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.section>
                        </>
                    ) : (
                        <motion.section variants={item}>
                            <Card className="glass glass-card">
                                <CardContent className="text-center py-12">
                                    <Heart className="w-16 h-16 mx-auto mb-4 text-foreground/30" />
                                    <h3 className="text-lg font-medium mb-2 text-foreground">No Pattern Data Yet</h3>
                                    <p className="text-foreground/70 text-sm">
                                        You haven't completed enough emotional check-ins to analyze patterns.
                                        Perform regular check-ins to see insights into your emotional patterns.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.section>
                    )}
                </div>
            </motion.main>
        </>
    );
};

export default EmotionalPatternsPage;
