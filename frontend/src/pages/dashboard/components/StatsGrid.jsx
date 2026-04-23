import React, { memo, Suspense, lazy, useMemo } from "react";
import { Users, TrendingUp, AlertTriangle } from "lucide-react";

// Lazy load StatCard for better performance
const StatCard = lazy(() =>
    import(/* webpackChunkName: "stat-card" */ "../StatCard")
);

// Optimized loading fallback - minimal animations for performance
const StatCardFallback = memo(() => (
    <div className="glass glass-card">
        <div className="glass__noise" />
        <div className="p-4 md:p-5">
            <div className="h-4 bg-muted/30 rounded w-1/3 mb-3"></div>
            <div className="h-6 bg-muted/20 rounded w-2/3 mb-2"></div>
            <div className="h-3 bg-muted/20 rounded w-1/2"></div>
        </div>
    </div>
));

StatCardFallback.displayName = 'StatCardFallback';

const StatsGrid = memo(({ mockData, realData, loading }) => {
    // Use real data if available, otherwise fall back to mock data
    const data = realData || {};

    // Performance optimization: Memoize calculations
    const stats = useMemo(() => {
        if (!data) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
                <Suspense fallback={<StatCardFallback />}>
                    <StatCard
                        icon={Users}
                        iconColor="primary"
                        title="Total Submissions"
                        value={data?.totalCheckins || 0}
                        subtitle={`${data?.submissionRate || 0}% submission rate`}
                        trend={data?.period === 'today' ? "+12%" : null}
                    />
                </Suspense>

                <Suspense fallback={<StatCardFallback />}>
                    <StatCard
                        icon={TrendingUp}
                        iconColor="gold"
                        title="Avg. Presence"
                        value={`${data?.averagePresence || 0}/10`}
                        subtitle="Engagement level"
                    />
                </Suspense>

                <Suspense fallback={<StatCardFallback />}>
                    <StatCard
                        icon={AlertTriangle}
                        iconColor="primary"
                        title="Avg. Capacity"
                        value={`${data?.averageCapacity || 0}/10`}
                        subtitle="Workload bandwidth"
                    />
                </Suspense>

                <Suspense fallback={<StatCardFallback />}>
                    <StatCard
                        icon={AlertTriangle}
                        iconColor="destructive"
                        title="Support Needed"
                        value={data?.flaggedUsers?.length || 0}
                        subtitle="Users flagged for support"
                    />
                </Suspense>
            </div>
        );
    }, [data]);

    return stats;
});

StatsGrid.displayName = 'StatsGrid';
export default StatsGrid;