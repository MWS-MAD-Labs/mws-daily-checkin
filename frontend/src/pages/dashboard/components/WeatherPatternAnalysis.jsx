import React, { memo, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { Cloud, Sun, CloudRain, Zap, Tornado, Snowflake, TrendingUp } from "lucide-react";

const WeatherPatternAnalysis = memo(({ data = {}, period = 'month' }) => {
    const weatherPatterns = useMemo(() => {
        if (!data?.recentActivity || data.recentActivity.length === 0) return [];

        // Group checkins by date and analyze weather patterns
        const dateGroups = {};

        data.recentActivity.forEach(activity => {
            const date = new Date(activity.submittedAt).toLocaleDateString();
            if (!dateGroups[date]) {
                dateGroups[date] = {
                    date,
                    weatherCounts: {},
                    moodCorrelations: {},
                    totalCheckins: 0,
                    avgPresence: 0,
                    avgCapacity: 0,
                    presenceSum: 0,
                    capacitySum: 0
                };
            }

            const weather = activity.weatherType;
            dateGroups[date].weatherCounts[weather] = (dateGroups[date].weatherCounts[weather] || 0) + 1;
            dateGroups[date].totalCheckins++;

            // Track mood correlations with weather
            activity.selectedMoods?.forEach(mood => {
                if (!dateGroups[date].moodCorrelations[weather]) {
                    dateGroups[date].moodCorrelations[weather] = {};
                }
                dateGroups[date].moodCorrelations[weather][mood] = (dateGroups[date].moodCorrelations[weather][mood] || 0) + 1;
            });

            dateGroups[date].presenceSum += activity.presenceLevel;
            dateGroups[date].capacitySum += activity.capacityLevel;
        });

        // Convert to array and calculate averages
        const patterns = Object.values(dateGroups).map(group => ({
            date: group.date,
            totalCheckins: group.totalCheckins,
            avgPresence: Math.round((group.presenceSum / group.totalCheckins) * 10) / 10,
            avgCapacity: Math.round((group.capacitySum / group.totalCheckins) * 10) / 10,
            // Dominant weather for the day
            dominantWeather: Object.entries(group.weatherCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
            weatherCount: Object.entries(group.weatherCounts).sort(([, a], [, b]) => b - a)[0]?.[1] || 0,
            // Weather distribution
            sunny: group.weatherCounts.sunny || 0,
            cloudy: group.weatherCounts.cloudy || 0,
            rain: group.weatherCounts.rain || 0,
            storm: group.weatherCounts.storm || 0,
            tornado: group.weatherCounts.tornado || 0,
            snow: group.weatherCounts.snow || 0,
            moodCorrelations: group.moodCorrelations
        }));

        return patterns.sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data]);

    const weatherStats = useMemo(() => {
        if (weatherPatterns.length === 0) return null;

        const weatherTrends = {
            sunny: [],
            cloudy: [],
            rain: [],
            storm: [],
            tornado: [],
            snow: []
        };

        weatherPatterns.forEach(day => {
            weatherTrends.sunny.push(day.sunny);
            weatherTrends.cloudy.push(day.cloudy);
            weatherTrends.rain.push(day.rain);
            weatherTrends.storm.push(day.storm);
            weatherTrends.tornado.push(day.tornado);
            weatherTrends.snow.push(day.snow);
        });

        // Calculate averages and trends
        const averages = {};
        Object.keys(weatherTrends).forEach(weather => {
            const counts = weatherTrends[weather].filter(count => count > 0);
            averages[weather] = counts.length > 0 ? Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10 : 0;
        });

        return {
            averages,
            totalDays: weatherPatterns.length,
            weatherDays: Object.entries(averages).filter(([, avg]) => avg > 0).length
        };
    }, [weatherPatterns]);

    const weatherIcons = {
        sunny: Sun,
        cloudy: Cloud,
        rain: CloudRain,
        storm: Zap,
        tornado: Tornado,
        snow: Snowflake
    };

    const weatherColors = {
        sunny: '#fbbf24',
        cloudy: '#6b7280',
        rain: '#3b82f6',
        storm: '#7c3aed',
        tornado: '#dc2626',
        snow: '#06b6d4'
    };

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
                        Weather: {data.dominantWeather} ({data.weatherCount})
                    </p>
                </div>
            );
        }
        return null;
    };

    if (weatherPatterns.length === 0) {
        return (
            <div className="glass glass-card p-6 text-center">
                <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No weather pattern data available</p>
            </div>
        );
    }

    return (
        <div className="glass glass-card transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Cloud className="w-4 h-4 text-primary" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Weather Pattern Analysis
                    </h2>
                </div>

                {/* Weather Statistics */}
                {weatherStats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                        {Object.entries(weatherStats.averages).map(([weather, avg]) => {
                            if (avg === 0) return null;
                            const Icon = weatherIcons[weather];
                            return (
                                <div key={weather} className="text-center p-3 bg-card/40 rounded-lg">
                                    <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: weatherColors[weather] }} />
                                    <p className="text-sm font-medium text-foreground capitalize">{weather}</p>
                                    <p className="text-xs text-muted-foreground">{avg} avg/day</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Weather Trend Chart */}
                <div className="h-64 md:h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weatherPatterns} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="sunnyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="cloudyGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6b7280" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
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
                            <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="sunny"
                                stackId="1"
                                stroke="#fbbf24"
                                fill="url(#sunnyGradient)"
                                name="Sunny"
                            />
                            <Area
                                type="monotone"
                                dataKey="cloudy"
                                stackId="1"
                                stroke="#6b7280"
                                fill="url(#cloudyGradient)"
                                name="Cloudy"
                            />
                            <Area
                                type="monotone"
                                dataKey="rain"
                                stackId="1"
                                stroke="#3b82f6"
                                fill="url(#rainGradient)"
                                name="Rain"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Weather Pattern Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Weather Distribution</h3>
                        <div className="space-y-2">
                            {weatherPatterns.slice(-7).map((day, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-card/20 rounded">
                                    <span className="text-sm text-foreground">
                                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {day.dominantWeather && (
                                            <div className="flex items-center gap-1">
                                                {React.createElement(weatherIcons[day.dominantWeather], {
                                                    className: "w-4 h-4",
                                                    style: { color: weatherColors[day.dominantWeather] }
                                                })}
                                                <span className="text-xs text-muted-foreground capitalize">
                                                    {day.dominantWeather}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Weather Impact on Well-being</h3>
                        <div className="space-y-3">
                            {Object.entries(weatherStats?.averages || {}).map(([weather, avg]) => {
                                if (avg === 0) return null;
                                const Icon = weatherIcons[weather];
                                const presenceImpact = weatherPatterns
                                    .filter(day => day.dominantWeather === weather)
                                    .reduce((sum, day) => sum + day.avgPresence, 0) /
                                    weatherPatterns.filter(day => day.dominantWeather === weather).length;

                                return (
                                    <div key={weather} className="flex items-center justify-between p-3 bg-card/20 rounded">
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4" style={{ color: weatherColors[weather] }} />
                                            <span className="text-sm font-medium text-foreground capitalize">{weather}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Avg Presence</p>
                                            <p className="text-sm font-semibold text-foreground">
                                                {isNaN(presenceImpact) ? 'N/A' : `${presenceImpact.toFixed(1)}/10`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

WeatherPatternAnalysis.displayName = 'WeatherPatternAnalysis';

export default WeatherPatternAnalysis;