import React, { memo, useState, useEffect, useMemo } from "react";
import { X, TrendingUp, Calendar, User, Activity, AlertTriangle, ExternalLink } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getUserTrends } from "../../../services/dashboardService";
import { useNavigate } from "react-router-dom";

const UserDetailModal = memo(({ user, isOpen, onClose }) => {
    const navigate = useNavigate();
    const [userTrends, setUserTrends] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('month');

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchUserTrends();
        }
    }, [isOpen, user, selectedPeriod]);

    const fetchUserTrends = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            console.log('Fetching trends for user:', user.id, 'period:', selectedPeriod);
            const response = await getUserTrends(user.id, selectedPeriod);
            console.log('User trends response:', response.data);
            setUserTrends(response.data?.data || response.data);
        } catch (error) {
            console.error('Error fetching user trends:', error);
            setUserTrends(null);
        } finally {
            setLoading(false);
        }
    };

    const derivedSummary = useMemo(() => {
        if (userTrends?.summary) {
            return userTrends.summary;
        }
        if (user?.periodSummary) {
            const submissions = user.periodSummary.submissions || 0;
            const needsSupport = user.periodSummary.needsSupportDays || 0;
            return {
                averagePresence: user.periodSummary.avgPresence || 0,
                averageCapacity: user.periodSummary.avgCapacity || 0,
                supportNeededCount: needsSupport,
                emotionalStability: submissions ? Math.max(0, 1 - (needsSupport / submissions)) : null
            };
        }
        return null;
    }, [userTrends?.summary, user?.periodSummary]);

    if (!isOpen || !user) return null;

    const roleDepartmentLabel = [user.role, user.department || user.unit].filter(Boolean).join(' • ');

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
                    <p className="font-medium text-foreground mb-2">{new Date(label).toLocaleDateString()}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value}/10
                        </p>
                    ))}
                    {data && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                            {data.selectedMoods && data.selectedMoods.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Moods: {data.selectedMoods.join(', ')}
                                </p>
                            )}
                            {data.weatherType && (
                                <p className="text-xs text-muted-foreground">
                                    Weather: {data.weatherType}
                                </p>
                            )}
                            {data.needsSupport && (
                                <p className="text-xs text-red-500 font-medium">
                                    Support requested
                                </p>
                            )}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const periods = [
        { id: 'week', label: 'Week' },
        { id: 'month', label: 'Month' },
        { id: 'semester', label: 'Semester' }
    ];

    return (
        <div className="fixed inset-0 bg-foreground/70 dark:bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
                            <p className="text-sm text-muted-foreground capitalize">{roleDepartmentLabel || 'Team member'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate(`/emotional-wellness/${user.id}`)}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            title="View full individual report"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Full Report
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                            title="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
                    {/* Period Selector */}
                    <div className="flex items-center gap-2 mb-6">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Period:</span>
                        <div className="flex gap-1">
                            {periods.map((period) => (
                                <button
                                    key={period.id}
                                    onClick={() => setSelectedPeriod(period.id)}
                                    className={`px-3 py-1 text-xs rounded-full transition-colors ${selectedPeriod === period.id
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {period.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stats Overview */}
                    {derivedSummary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="glass glass-card p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm font-medium text-foreground">Avg Presence</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {Number(derivedSummary.averagePresence || 0).toFixed(1)}/10
                                </p>
                            </div>
                            <div className="glass glass-card p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm font-medium text-foreground">Avg Capacity</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {Number(derivedSummary.averageCapacity || 0).toFixed(1)}/10
                                </p>
                            </div>
                            <div className="glass glass-card p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-sm font-medium text-foreground">Support Needed</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {derivedSummary.supportNeededCount || 0} times
                                </p>
                            </div>
                            <div className="glass glass-card p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Activity className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-foreground">Emotional Stability</span>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {derivedSummary.emotionalStability ? (derivedSummary.emotionalStability * 100).toFixed(0) : 0}%
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Pattern Analysis */}
                    {userTrends && userTrends.summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mood Patterns */}
                            <div className="glass glass-card p-4">
                                <h4 className="text-lg font-semibold text-foreground mb-3">Mood Patterns</h4>
                                {userTrends.summary.moodPatterns && Object.keys(userTrends.summary.moodPatterns).length > 0 ? (
                                    <div className="space-y-2">
                                        {Object.entries(userTrends.summary.moodPatterns)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 5)
                                            .map(([mood, count]) => (
                                                <div key={mood} className="flex justify-between items-center">
                                                    <span className="text-sm capitalize">{mood}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-muted rounded-full h-2">
                                                            <div
                                                                className="bg-primary h-2 rounded-full"
                                                                style={{
                                                                    width: `${(count / Math.max(...Object.values(userTrends.summary.moodPatterns))) * 100}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No mood data available</p>
                                )}
                            </div>

                            {/* Weather Patterns */}
                            <div className="glass glass-card p-4">
                                <h4 className="text-lg font-semibold text-foreground mb-3">Weather Patterns</h4>
                                {userTrends.summary.weatherPatterns && Object.keys(userTrends.summary.weatherPatterns).length > 0 ? (
                                    <div className="space-y-2">
                                        {Object.entries(userTrends.summary.weatherPatterns)
                                            .sort(([, a], [, b]) => b - a)
                                            .slice(0, 5)
                                            .map(([weather, count]) => (
                                                <div key={weather} className="flex justify-between items-center">
                                                    <span className="text-sm capitalize">{weather.replace('-', ' ')}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-muted rounded-full h-2">
                                                            <div
                                                                className="bg-blue-500 h-2 rounded-full"
                                                                style={{
                                                                    width: `${(count / Math.max(...Object.values(userTrends.summary.weatherPatterns))) * 100}%`
                                                                }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No weather data available</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Insights */}
                    {userTrends && userTrends.summary && userTrends.summary.insights && userTrends.summary.insights.length > 0 && (
                        <div className="glass glass-card p-4 mb-6">
                            <h4 className="text-lg font-semibold text-foreground mb-3">AI Insights</h4>
                            <div className="space-y-2">
                                {userTrends.summary.insights.map((insight, index) => (
                                    <div key={index} className="flex items-start gap-2 p-2 bg-muted/20 rounded-lg">
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                        <p className="text-sm text-foreground">{insight}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trend Chart */}
                    <div className="glass glass-card p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Emotional Trends</h3>
                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="text-muted-foreground">Loading trends...</div>
                            </div>
                        ) : userTrends?.trends && userTrends.trends.length > 0 ? (
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={userTrends.trends}>
                                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                        <XAxis
                                            dataKey="date"
                                            className="text-xs"
                                            tick={{ fill: 'currentColor' }}
                                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        />
                                        <YAxis domain={[0, 10]} className="text-xs" tick={{ fill: 'currentColor' }} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Line
                                            type="monotone"
                                            dataKey="presenceLevel"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                                            name="Presence"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="capacityLevel"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                                            name="Capacity"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="h-40 flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg">
                                    No trend data available for this period.
                                </div>
                                {user.lastCheckin ? (
                                    <div className="rounded-lg border border-border/60 p-4 bg-card/40">
                                        <p className="text-sm font-semibold text-foreground mb-2">Latest check-in</p>
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {new Date(user.lastCheckin.date).toLocaleString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span>Presence: {user.lastCheckin.presenceLevel}/10</span>
                                            <span>Capacity: {user.lastCheckin.capacityLevel}/10</span>
                                            {user.lastCheckin.weatherType && <span>{user.lastCheckin.weatherType}</span>}
                                            {user.lastCheckin.moods?.length > 0 && (
                                                <span>Moods: {user.lastCheckin.moods.slice(0, 3).join(', ')}</span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground text-center">
                                        This team member has not submitted any check-ins in the selected period.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Weekly Trends */}
                    {userTrends?.weeklyAverages && userTrends.weeklyAverages.length > 0 && (
                        <div className="glass glass-card p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Emotional Trends</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {userTrends.weeklyAverages.map((week, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-card/40 rounded-lg border border-border/40">
                                        <div className="flex items-center gap-3">
                                            <div className="text-lg">
                                                {week.dominantWeather === 'sunny' ? '☀️' :
                                                    week.dominantWeather === 'cloudy' ? '☁️' :
                                                        week.dominantWeather === 'rain' ? '🌧️' :
                                                            week.dominantWeather === 'storm' ? '⛈️' :
                                                                week.dominantWeather === 'tornado' ? '🌪️' : '❄️'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    Week of {week.week}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {week.dominantMoods?.join(', ')} • {week.checkinCount} check-ins
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-foreground">
                                                P: {week.avgPresence}/10
                                            </p>
                                            <p className="text-sm font-medium text-foreground">
                                                C: {week.avgCapacity}/10
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Check-ins */}
                    {userTrends?.trends && userTrends.trends.length > 0 && (
                        <div className="glass glass-card p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Check-ins</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {userTrends.trends.slice(-10).reverse().map((checkin, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 bg-card/40 rounded-lg border border-border/40">
                                        <div className="text-lg flex-shrink-0">
                                            {checkin.weatherType === 'sunny' ? '☀️' :
                                                checkin.weatherType === 'cloudy' ? '☁️' :
                                                    checkin.weatherType === 'rain' ? '🌧️' :
                                                        checkin.weatherType === 'storm' ? '⛈️' :
                                                            checkin.weatherType === 'tornado' ? '🌪️' : '❄️'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-foreground">
                                                    {new Date(checkin.date).toLocaleDateString()}
                                                </p>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-foreground">
                                                        P: {checkin.presenceLevel}/10
                                                    </p>
                                                    <p className="text-sm font-medium text-foreground">
                                                        C: {checkin.capacityLevel}/10
                                                    </p>
                                                </div>
                                            </div>
                                            {checkin.selectedMoods && checkin.selectedMoods.length > 0 && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Moods: {checkin.selectedMoods.join(', ')}
                                                </p>
                                            )}
                                            {checkin.details && (
                                                <p className="text-sm text-foreground italic">
                                                    "{checkin.details.length > 100 ? checkin.details.substring(0, 100) + '...' : checkin.details}"
                                                </p>
                                            )}
                                            {checkin.needsSupport && (
                                                <div className="mt-2">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Support requested
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

UserDetailModal.displayName = 'UserDetailModal';

export default UserDetailModal;

