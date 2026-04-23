import { memo, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = {
    student: '#8884d8',
    staff: '#82ca9d',
    teacher: '#ffc658',
    admin: '#ff7300',
    directorate: '#00ff00',
    superadmin: '#ff0000'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">
                    Submitted: {data.submitted}/{data.total} ({data.submissionRate}%)
                </p>
                <p className="text-sm text-muted-foreground">
                    Avg Presence: {data.avgPresence}/10
                </p>
                <p className="text-sm text-muted-foreground">
                    Avg Capacity: {data.avgCapacity}/10
                </p>
            </div>
        );
    }
    return null;
};

const RoleBreakdownChart = memo(({ roleBreakdown = [], viewMode = 'bar' }) => {
    const chartData = useMemo(() => {
        const source = Array.isArray(roleBreakdown) ? roleBreakdown : [];
        return source.map(role => ({
            name: role.role.charAt(0).toUpperCase() + role.role.slice(1),
            submitted: role.submitted,
            total: role.total,
            submissionRate: role.submissionRate,
            avgPresence: role.avgPresence,
            avgCapacity: role.avgCapacity
        }));
    }, [roleBreakdown]);

    const pieData = useMemo(() => {
        const source = Array.isArray(roleBreakdown) ? roleBreakdown : [];
        return source.map(role => ({
            name: role.role.charAt(0).toUpperCase() + role.role.slice(1),
            value: role.submitted,
            total: role.total
        }));
    }, [roleBreakdown]);

    if (chartData.length === 0) return null;

    if (viewMode === 'pie') {
        return (
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, total }) => `${name}: ${value}/${total}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#8884d8'} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        );
    }

    return (
        <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                    />
                    <YAxis
                        className="text-xs"
                        tick={{ fill: 'currentColor' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                        dataKey="submitted"
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
});

RoleBreakdownChart.displayName = 'RoleBreakdownChart';

export default RoleBreakdownChart;
