import React, { memo, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, BarChart3 } from "lucide-react";

const MoodTrendAnalysis = memo(({ data = {}, period = 'week' }) => {
    const moodTrends = useMemo(() => {
        if (!data?.recentActivity || data.recentActivity.length === 0) return [];

        // Group checkins by date and analyze mood patterns
        const dateGroups = {};

        data.recentActivity.forEach(activity => {
            const date = new Date(activity.submittedAt).toLocaleDateString();
            if (!dateGroups[date]) {
                dateGroups[date] = {
                    date,
                    totalCheckins: 0,
                    moodCounts: {},
                    weatherCounts: {},
                    avgPresence: 0,
                    avgCapacity: 0,
                    presenceSum: 0,
                    capacitySum: 0
                };
            }

            dateGroups[date].totalCheckins++;
            dateGroups[date].presenceSum += activity.presenceLevel;
            dateGroups[date].capacitySum += activity.capacityLevel;

            // Count moods
            activity.selectedMoods?.forEach(mood => {
                dateGroups[date].moodCounts[mood] = (dateGroups[date].moodCounts[mood] || 0) + 1;
            });

            // Count weather
            const weather = activity.weatherType;
            dateGroups[date].weatherCounts[weather] = (dateGroups[date].weatherCounts[weather] || 0) + 1;
        });

        // Convert to array and calculate averages
        const trends = Object.values(dateGroups).map(group => ({
            date: group.date,
            totalCheckins: group.totalCheckins,
            avgPresence: Math.round((group.presenceSum / group.totalCheckins) * 10) / 10,
            avgCapacity: Math.round((group.capacitySum / group.totalCheckins) * 10) / 10,
            // Top mood for the day
            topMood: Object.entries(group.moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
            topMoodCount: Object.entries(group.moodCounts).sort(([, a], [, b]) => b - a)[0]?.[1] || 0,
            // Top weather for the day
            topWeather: Object.entries(group.weatherCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
            topWeatherCount: Object.entries(group.weatherCounts).sort(([, a], [, b]) => b - a)[0]?.[1] || 0,
            moodDistribution: group.moodCounts,
            weatherDistribution: group.weatherCounts
        }));

        return trends.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data]);

    const moodStats = useMemo(() => {
        if (moodTrends.length === 0) return null;

        const allMoods = {};
        const allWeather = {};

        moodTrends.forEach(day => {
            Object.entries(day.moodDistribution).forEach(([mood, count]) => {
                allMoods[mood] = (allMoods[mood] || 0) + count;
            });
            Object.entries(day.weatherDistribution).forEach(([weather, count]) => {
                allWeather[weather] = (allWeather[weather] || 0) + count;
            });
        });

        const topMoods = Object.entries(allMoods)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([mood, count]) => ({ mood, count }));

        const topWeather = Object.entries(allWeather)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([weather, count]) => ({ weather, count }));

        return { topMoods, topWeather };
    }, [moodTrends]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    <p className="text-sm text-emerald-600">Presence: {data.avgPresence}/10</p>
                    <p className="text-sm text-blue-600">Capacity: {data.avgCapacity}/10</p>
                    <p className="text-sm text-purple-600">Check-ins: {data.totalCheckins}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                        Top Mood: {data.topMood} ({data.topMoodCount})
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                        Top Weather: {data.topWeather} ({data.topWeatherCount})
                    </p>
                </div>
            );
        }
        return null;
    };

    if (moodTrends.length === 0) {
        return (
            <div className="glass glass-card p-6 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trend data available for analysis</p>
            </div>
        );
    }

    return (
        <div className="glass glass-card transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Mood & Weather Trends Analysis
                    </h2>
                </div>

                {/* Summary Stats */}
                {moodStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-card/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">Top Mood</p>
                            <p className="font-semibold text-foreground capitalize">
                                {moodStats.topMoods[0]?.mood || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {moodStats.topMoods[0]?.count || 0} times
                            </p>
                        </div>
                        <div className="text-center p-3 bg-card/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">Top Weather</p>
                            <p className="font-semibold text-foreground capitalize">
                                {moodStats.topWeather[0]?.weather || 'N/A'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {moodStats.topWeather[0]?.count || 0} times
                            </p>
                        </div>
                        <div className="text-center p-3 bg-card/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">Avg Check-ins/Day</p>
                            <p className="font-semibold text-foreground">
                                {Math.round(moodTrends.reduce((sum, day) => sum + day.totalCheckins, 0) / moodTrends.length * 10) / 10}
                            </p>
                        </div>
                        <div className="text-center p-3 bg-card/40 rounded-lg">
                            <p className="text-sm text-muted-foreground">Trend Period</p>
                            <p className="font-semibold text-foreground capitalize">
                                {period}
                            </p>
                        </div>
                    </div>
                )}

                {/* Trend Chart */}
                <div className="h-64 md:h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={moodTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="presenceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="capacityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                domain={[0, 10]}
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="avgPresence"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#presenceGradient)"
                                strokeWidth={2}
                                name="Avg Presence"
                            />
                            <Area
                                type="monotone"
                                dataKey="avgCapacity"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#capacityGradient)"
                                strokeWidth={2}
                                name="Avg Capacity"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Mood Pattern Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Daily Mood Patterns</h3>
                        <div className="space-y-2">
                            {moodTrends.slice(-7).map((day, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-card/20 rounded">
                                    <span className="text-sm text-foreground">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {day.topMood}
                                        </span>
                                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Weather Patterns</h3>
                        <div className="space-y-2">
                            {moodTrends.slice(-7).map((day, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-card/20 rounded">
                                    <span className="text-sm text-foreground">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {day.topWeather}
                                        </span>
                                        <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

MoodTrendAnalysis.displayName = 'MoodTrendAnalysis';

export default MoodTrendAnalysis;