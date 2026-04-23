import React, { memo, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, ChevronDown, AlertTriangle } from "lucide-react";

const ComparativeAnalysis = memo(({ data = {}, currentPeriod = 'today' }) => {
    const [comparisonPeriod, setComparisonPeriod] = useState('week');
    const [comparisonType, setComparisonType] = useState('period-over-period');

    const comparisonData = useMemo(() => {
        if (!data?.recentActivity || data.recentActivity.length === 0) return null;

        const activities = data.recentActivity;
        const now = new Date();

        // Define comparison periods
        const periods = {
            'day-over-day': {
                current: { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now },
                previous: { start: new Date(now.getTime() - 48 * 60 * 60 * 1000), end: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
            },
            'week-over-week': {
                current: { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
                previous: { start: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), end: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
            },
            'month-over-month': {
                current: { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
                previous: { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) }
            }
        };

        const selectedPeriod = periods[comparisonType];
        if (!selectedPeriod) return null;

        // Filter activities for current and previous periods
        const currentActivities = activities.filter(activity => {
            const activityDate = new Date(activity.submittedAt);
            return activityDate >= selectedPeriod.current.start && activityDate <= selectedPeriod.current.end;
        });

        const previousActivities = activities.filter(activity => {
            const activityDate = new Date(activity.submittedAt);
            return activityDate >= selectedPeriod.previous.start && activityDate <= selectedPeriod.previous.end;
        });

        // Calculate metrics for both periods
        const calculateMetrics = (activities) => {
            if (activities.length === 0) return { count: 0, avgPresence: 0, avgCapacity: 0, supportRate: 0 };

            const totalPresence = activities.reduce((sum, a) => sum + a.presenceLevel, 0);
            const totalCapacity = activities.reduce((sum, a) => sum + a.capacityLevel, 0);
            const supportCount = activities.filter(a => a.needsSupport).length;

            return {
                count: activities.length,
                avgPresence: Math.round((totalPresence / activities.length) * 10) / 10,
                avgCapacity: Math.round((totalCapacity / activities.length) * 10) / 10,
                supportRate: Math.round((supportCount / activities.length) * 100)
            };
        };

        const currentMetrics = calculateMetrics(currentActivities);
        const previousMetrics = calculateMetrics(previousActivities);

        // Calculate changes
        const calculateChange = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            current: {
                ...currentMetrics,
                period: comparisonType === 'day-over-day' ? 'Today' :
                    comparisonType === 'week-over-week' ? 'This Week' : 'This Month'
            },
            previous: {
                ...previousMetrics,
                period: comparisonType === 'day-over-day' ? 'Yesterday' :
                    comparisonType === 'week-over-week' ? 'Last Week' : 'Last Month'
            },
            changes: {
                count: calculateChange(currentMetrics.count, previousMetrics.count),
                avgPresence: calculateChange(currentMetrics.avgPresence, previousMetrics.avgCapacity),
                avgCapacity: calculateChange(currentMetrics.avgCapacity, previousMetrics.avgCapacity),
                supportRate: calculateChange(currentMetrics.supportRate, previousMetrics.supportRate)
            }
        };
    }, [data, comparisonType]);

    const chartData = useMemo(() => {
        if (!comparisonData) return [];

        return [
            {
                metric: 'Check-ins',
                current: comparisonData.current.count,
                previous: comparisonData.previous.count,
                change: comparisonData.changes.count
            },
            {
                metric: 'Avg Presence',
                current: comparisonData.current.avgPresence,
                previous: comparisonData.previous.avgPresence,
                change: comparisonData.changes.avgPresence
            },
            {
                metric: 'Avg Capacity',
                current: comparisonData.current.avgCapacity,
                previous: comparisonData.previous.avgCapacity,
                change: comparisonData.changes.avgCapacity
            },
            {
                metric: 'Support Rate %',
                current: comparisonData.current.supportRate,
                previous: comparisonData.previous.supportRate,
                change: comparisonData.changes.supportRate
            }
        ];
    }, [comparisonData]);

    const getChangeIcon = (change) => {
        if (change > 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
        if (change < 0) return <TrendingDown className="w-3 h-3 text-red-500" />;
        return <Minus className="w-3 h-3 text-gray-500" />;
    };

    const getChangeColor = (change) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground mb-2">{label}</p>
                    <p className="text-sm text-blue-600">Current: {data.current}</p>
                    <p className="text-sm text-gray-600">Previous: {data.previous}</p>
                    <p className={`text-sm font-medium ${getChangeColor(data.change)}`}>
                        Change: {data.change > 0 ? '+' : ''}{data.change}%
                    </p>
                </div>
            );
        }
        return null;
    };

    if (!comparisonData) {
        return (
            <div className="glass glass-card p-6 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Insufficient data for comparative analysis</p>
            </div>
        );
    }

    return (
        <div className="glass glass-card transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <h2 className="text-base md:text-lg font-semibold text-foreground">
                            Comparative Analysis
                        </h2>
                    </div>

                    {/* Comparison Type Selector */}
                    <div className="flex gap-2">
                        <select
                            value={comparisonType}
                            onChange={(e) => setComparisonType(e.target.value)}
                            className="px-3 py-1 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="day-over-day">Day over Day</option>
                            <option value="week-over-week">Week over Week</option>
                            <option value="month-over-month">Month over Month</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {chartData.map((item, index) => (
                        <div key={index} className="glass glass-card p-3">
                            <p className="text-xs text-muted-foreground mb-1">{item.metric}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-foreground">{item.current}</span>
                                <div className={`flex items-center gap-1 text-xs ${getChangeColor(item.change)}`}>
                                    {getChangeIcon(item.change)}
                                    <span>{item.change > 0 ? '+' : ''}{item.change}%</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                vs {item.previous} prev
                            </p>
                        </div>
                    ))}
                </div>

                {/* Comparison Chart */}
                <div className="h-64 md:h-80 mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis
                                dataKey="metric"
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <YAxis
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar
                                dataKey="current"
                                fill="#3b82f6"
                                radius={[2, 2, 0, 0]}
                                name="Current Period"
                            />
                            <Bar
                                dataKey="previous"
                                fill="#e5e7eb"
                                radius={[2, 2, 0, 0]}
                                name="Previous Period"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Key Insights</h3>
                        <div className="space-y-2">
                            {comparisonData.changes.count !== 0 && (
                                <div className="flex items-center gap-2 p-2 bg-card/40 rounded">
                                    {getChangeIcon(comparisonData.changes.count)}
                                    <span className="text-sm text-foreground">
                                        Check-in volume {comparisonData.changes.count > 0 ? 'increased' : 'decreased'} by {Math.abs(comparisonData.changes.count)}%
                                    </span>
                                </div>
                            )}
                            {comparisonData.changes.avgPresence !== 0 && (
                                <div className="flex items-center gap-2 p-2 bg-card/40 rounded">
                                    {getChangeIcon(comparisonData.changes.avgPresence)}
                                    <span className="text-sm text-foreground">
                                        Team presence {comparisonData.changes.avgPresence > 0 ? 'improved' : 'declined'} by {Math.abs(comparisonData.changes.avgPresence)}%
                                    </span>
                                </div>
                            )}
                            {comparisonData.changes.supportRate > 10 && (
                                <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm text-red-700">
                                        Support requests increased by {comparisonData.changes.supportRate}%
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Period Comparison</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-card/20 rounded">
                                <span className="text-sm font-medium text-foreground">{comparisonData.current.period}</span>
                                <span className="text-sm text-muted-foreground">{comparisonData.current.count} check-ins</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-card/20 rounded">
                                <span className="text-sm font-medium text-foreground">{comparisonData.previous.period}</span>
                                <span className="text-sm text-muted-foreground">{comparisonData.previous.count} check-ins</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

ComparativeAnalysis.displayName = 'ComparativeAnalysis';

export default ComparativeAnalysis;
