import { memo, useMemo, useState } from "react";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, User } from "lucide-react";
import UserListModal from "./UserListModal";
import { formatCalendarDateKey, formatCalendarDateLabel, parseCalendarDate } from "../utils/calendarDate";

const sortByCalendarDate = (left, right) => {
    const leftTime = parseCalendarDate(left)?.getTime() || 0;
    const rightTime = parseCalendarDate(right)?.getTime() || 0;
    return leftTime - rightTime;
};

const UserTrendChart = memo(({ trendData = [], userData = [], selectedUser = null, period = 'week' }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        title: '',
        users: [],
        totalUsers: 0,
        type: ''
    });

    const chartData = useMemo(() => {
        if (Array.isArray(trendData) && trendData.length > 0) {
            return trendData
                .map((entry) => ({
                    date: entry.date,
                    presence: typeof entry.avgPresence === "number" ? entry.avgPresence : 0,
                    capacity: typeof entry.avgCapacity === "number" ? entry.avgCapacity : 0,
                    submissions: entry.totalCheckins ?? entry.submissions ?? 0,
                    users: Array.isArray(entry.users) ? entry.users : [],
                }))
                .filter((entry) => entry.date)
                .sort((a, b) => sortByCalendarDate(a.date, b.date));
        }

        if (!userData || userData.length === 0) return [];

        // Group data by date and calculate averages
        const dateGroups = {};

        userData.forEach(checkin => {
            const dateKey = formatCalendarDateKey(checkin.date || checkin.submittedAt);
            if (!dateKey) return;
            if (!dateGroups[dateKey]) {
                dateGroups[dateKey] = {
                    date: dateKey,
                    presence: [],
                    capacity: [],
                    count: 0,
                    users: []
                };
            }
            dateGroups[dateKey].presence.push(checkin.presenceLevel);
            dateGroups[dateKey].capacity.push(checkin.capacityLevel);
            dateGroups[dateKey].count++;
            dateGroups[dateKey].users.push(checkin);
        });

        return Object.values(dateGroups).map(group => ({
            date: group.date,
            presence: group.presence.reduce((a, b) => a + b, 0) / group.presence.length,
            capacity: group.capacity.reduce((a, b) => a + b, 0) / group.capacity.length,
            submissions: group.count,
            users: group.users || [] // Store users for each date
        })).sort((a, b) => sortByCalendarDate(a.date, b.date));
    }, [trendData, userData]);

    const xAxisMinTickGap = period === "today" ? 48 : period === "week" ? 24 : 12;
    const hasAnySubmissions = chartData.some((entry) => entry.submissions > 0);

    const handleSubmissionsClick = (data) => {
        if (data && data.users) {
            setModalState({
                isOpen: true,
                title: `Submissions on ${formatCalendarDateLabel(data.date, { year: "numeric", month: "short", day: "numeric" })}`,
                users: data.users,
                totalUsers: data.submissions,
                type: 'submissions'
            });
        }
    };

    const closeModal = () => {
        setModalState({ isOpen: false, title: '', users: [], totalUsers: 0, type: '' });
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = chartData.find(d => d.date === label);
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-foreground mb-2">
                        {formatCalendarDateLabel(label, { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: {entry.value.toFixed(1)}
                            {entry.dataKey === 'submissions' ? '' : '/10'}
                        </p>
                    ))}
                    {data && data.submissions > 0 && (
                        <button
                            onClick={() => handleSubmissionsClick(data)}
                            className="mt-2 text-xs text-primary hover:underline"
                        >
                            View {data.submissions} submissions
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    if (chartData.length === 0 || !hasAnySubmissions) {
        return (
            <div className="glass glass-card p-6 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trend data available</p>
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
                        {selectedUser ? `${selectedUser.name}'s Trends` : 'Organization Trends'}
                    </h2>
                </div>

                <div className="h-64 md:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                minTickGap={xAxisMinTickGap}
                                tickFormatter={(value) => formatCalendarDateLabel(value, { month: 'short', day: 'numeric' })}
                            />
                            <YAxis
                                domain={[0, 10]}
                                className="text-xs"
                                tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="presence"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#presenceGradient)"
                                strokeWidth={2}
                                name="Presence"
                            />
                            <Area
                                type="monotone"
                                dataKey="capacity"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#capacityGradient)"
                                strokeWidth={2}
                                name="Capacity"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        <span className="text-muted-foreground">Presence Level</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-muted-foreground">Capacity Level</span>
                    </div>
                </div>
            </div>

            <UserListModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                users={modalState.users}
                totalUsers={modalState.totalUsers}
                type={modalState.type}
            />
        </div>
    );
});

UserTrendChart.displayName = 'UserTrendChart';

export default UserTrendChart;
