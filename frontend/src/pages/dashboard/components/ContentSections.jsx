import { memo, Suspense, lazy } from "react";

const FlaggedUsers = lazy(() => import("../FlaggedStudents"));
const CheckInRequests = lazy(() => import("../CheckInRequests"));
const InsightsPanel = lazy(() => import("./InsightsPanel"));
const RecentActivitySection = lazy(() => import("./RecentActivitySection"));
const PercentageAnalytics = lazy(() => import("./PercentageAnalytics"));
const UserTrendChart = lazy(() => import("./UserTrendChart"));
const UserHistorySection = lazy(() => import("./UserHistorySection"));
const HeadUnitStaffPanel = lazy(() => import("./HeadUnitStaffPanel"));

// Optimized loading fallback - minimal animations for performance
const ContentFallback = memo(() => (
    <div className="glass glass-card">
        <div className="glass__noise" />
        <div className="p-4 md:p-6">
            <div className="h-4 bg-muted/30 rounded w-1/3 mb-3"></div>
            <div className="h-3 bg-muted/20 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted/20 rounded w-2/3"></div>
        </div>
    </div>
));

ContentFallback.displayName = 'ContentFallback';

const ContentSections = memo(({ realData, selectedPeriod, userId, isHeadUnit, isDirectorate }) => {
    const data = realData || {};
    const canViewStaffExplorer = (isHeadUnit || isDirectorate) && Array.isArray(data?.unitStaffDetails) && data.unitStaffDetails.length > 0;

    return (
        <>
            {/* Overview Analytics - Moved to top position */}
            <Suspense fallback={<ContentFallback />}>
                <div className="mb-4 md:mb-6">
                    <PercentageAnalytics data={data} period={selectedPeriod} />
                </div>
            </Suspense>

            {canViewStaffExplorer && (
                <Suspense fallback={<ContentFallback />}>
                    <div className="mb-4 md:mb-6">
                        <HeadUnitStaffPanel
                            staff={data?.unitStaffDetails || []}
                            summary={data?.unitStaffSummary}
                            isDirectorate={isDirectorate && !isHeadUnit}
                        />
                    </div>
                </Suspense>
            )}

            {/* Critical Information - Prioritized at top */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                <Suspense fallback={<ContentFallback />}>
                    {/* Check-in Requests - Prioritized for immediate attention */}
                    <CheckInRequests requests={data?.checkinRequests || []} isHeadUnit={isHeadUnit} />
                </Suspense>

                <Suspense fallback={<ContentFallback />}>
                    {/* Flagged Users - Need Support - Prioritized for immediate attention */}
                    <div data-section="flagged-users">
                        <FlaggedUsers users={data?.flaggedUsers || []} />
                    </div>
                </Suspense>
            </div>

            {/* Today's Mood and Internal Weather panels removed - now accessible via Overview Analytics charts */}

            {/* Not Submitted Users panel removed - now accessible via Participation Rate click in Overview Analytics */}

            {/* Department Analytics removed - now integrated into Overview Analytics Panel #1 */}
            {/* Mood Trend Analysis temporarily removed as requested */}

            {/* <Suspense fallback={<ContentFallback />}>
                Weather Pattern Analysis
                <div className="mb-4 md:mb-6">
                    <WeatherPatternAnalysis data={data} period={selectedPeriod} />
                </div>
            </Suspense> */}

            {/* Predictive Analytics moved to Overview Analytics Panel #1 */}

            {/* Comparative Analysis (Organization Trends) temporarily removed as requested */}

                <Suspense fallback={<ContentFallback />}>
                    {/* User Trend Analysis */}
                    <div className="mb-4 md:mb-6">
                    <UserTrendChart trendData={data?.periodTimeline || []} period={selectedPeriod} />
                    </div>
                </Suspense>

            {/* AI Insights Panel - Trigger-based loading */}
            <Suspense fallback={<ContentFallback />}>
                <InsightsPanel insights={data?.insights || []} />
            </Suspense>

            {/* Recent Activity - Moved to bottom */}
            <Suspense fallback={<ContentFallback />}>
                <div className="mt-6">
                    <RecentActivitySection activities={data?.recentActivity || []} />
                </div>
            </Suspense>

            {/* User Check-in History - Only show if userId is provided (individual dashboard) */}
            {userId && (
                <Suspense fallback={<ContentFallback />}>
                    <div className="mb-4 md:mb-6">
                        <UserHistorySection userId={userId} />
                    </div>
                </Suspense>
            )}
        </>
    );
});

ContentSections.displayName = 'ContentSections';
export default ContentSections;
