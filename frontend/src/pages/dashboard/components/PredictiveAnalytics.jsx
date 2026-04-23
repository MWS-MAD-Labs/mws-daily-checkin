import { memo, useMemo } from "react";
import { TrendingUp, AlertTriangle, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { INSIGHT_TONES } from "./insightCardTones";

const PredictiveAnalytics = memo(({ data = {} }) => {
    const predictions = useMemo(() => {
        if (!data?.recentActivity || data.recentActivity.length === 0) return null;

        // Analyze historical patterns to make predictions
        const activities = data.recentActivity;
        const totalActivities = activities.length;

        // Calculate trends
        const moodTrends = {};
        const weatherTrends = {};
        const supportTrends = { total: 0, supported: 0 };

        activities.forEach(activity => {
            // Mood frequency analysis
            activity.selectedMoods?.forEach(mood => {
                moodTrends[mood] = (moodTrends[mood] || 0) + 1;
            });

            // Weather pattern analysis
            const weather = activity.weatherType;
            weatherTrends[weather] = (weatherTrends[weather] || 0) + 1;

            // Support need analysis
            supportTrends.total++;
            if (activity.needsSupport) {
                supportTrends.supported++;
            }
        });

        // Calculate percentages
        const supportRate = supportTrends.total > 0 ? (supportTrends.supported / supportTrends.total) * 100 : 0;

        // Predict next week's patterns based on current trends
        const topMoods = Object.entries(moodTrends)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([mood, count]) => ({
                mood,
                count,
                percentage: Math.round((count / totalActivities) * 100)
            }));

        const topWeather = Object.entries(weatherTrends)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([weather, count]) => ({
                weather,
                count,
                percentage: Math.round((count / totalActivities) * 100)
            }));

        // Risk assessment
        const riskFactors = [];
        if (supportRate > 20) {
            riskFactors.push({
                type: 'high',
                title: 'High Support Need',
                message: `${supportRate.toFixed(1)}% of users indicated they need support. Consider proactive outreach.`,
                icon: AlertTriangle,
                color: INSIGHT_TONES.risk.icon
            });
        }

        if (topMoods.some(m => ['sad', 'anxious', 'overwhelmed'].includes(m.mood))) {
            riskFactors.push({
                type: 'medium',
                title: 'Emotional Well-being Concerns',
                message: 'Negative mood patterns detected. Monitor closely and consider additional support resources.',
                icon: AlertTriangle,
                color: INSIGHT_TONES.warning.icon
            });
        }

        // Positive indicators
        const positiveIndicators = [];
        if (supportRate < 10) {
            positiveIndicators.push({
                title: 'Strong Team Resilience',
                message: 'Low support requests indicate good overall team well-being.',
                icon: CheckCircle,
                color: INSIGHT_TONES.positive.icon
            });
        }

        if (topMoods.some(m => ['happy', 'excited', 'calm'].includes(m.mood))) {
            positiveIndicators.push({
                title: 'Positive Team Dynamics',
                message: 'Strong presence of positive moods suggests healthy team environment.',
                icon: CheckCircle,
                color: INSIGHT_TONES.positive.icon
            });
        }

        return {
            topMoods,
            topWeather,
            supportRate,
            riskFactors,
            positiveIndicators,
            totalActivities,
            predictions: {
                nextWeekMood: topMoods[0]?.mood || 'stable',
                nextWeekWeather: topWeather[0]?.weather || 'mixed',
                supportTrend: supportRate > 15 ? 'increasing' : 'stable'
            }
        };
    }, [data]);

    if (!predictions) {
        return (
            <div className="glass glass-card p-6 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Insufficient data for predictive analysis</p>
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
                        Predictive Analytics & Insights
                    </h2>
                </div>

                {/* Key Predictions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-foreground">Next Week Mood</span>
                        </div>
                        <p className="text-lg font-bold text-foreground capitalize">
                            {predictions.predictions.nextWeekMood}
                        </p>
                        <p className="text-xs text-muted-foreground">Based on current trends</p>
                    </div>

                    <div className="glass glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-foreground">Weather Pattern</span>
                        </div>
                        <p className="text-lg font-bold text-foreground capitalize">
                            {predictions.predictions.nextWeekWeather}
                        </p>
                        <p className="text-xs text-muted-foreground">Predicted dominant weather</p>
                    </div>

                    <div className="glass glass-card p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-foreground">Support Trend</span>
                        </div>
                        <p className="text-lg font-bold text-foreground capitalize">
                            {predictions.predictions.supportTrend}
                        </p>
                        <p className="text-xs text-muted-foreground">{predictions.supportRate.toFixed(1)}% need support</p>
                    </div>
                </div>

                {/* Risk Factors & Positive Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Risk Factors */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <AlertTriangle className={`w-4 h-4 ${INSIGHT_TONES.risk.icon}`} />
                            Risk Factors
                        </h3>
                        <div className="space-y-3">
                            {predictions.riskFactors.length > 0 ? (
                                predictions.riskFactors.map((risk, index) => {
                                    const Icon = risk.icon;
                                    return (
                                        <div key={index} className={`p-3 ${INSIGHT_TONES.risk.card}`}>
                                            <div className="flex items-start gap-2">
                                                <Icon className={`w-4 h-4 mt-0.5 ${risk.color}`} />
                                                <div>
                                                    <p className={`text-sm font-medium ${INSIGHT_TONES.risk.title}`}>{risk.title}</p>
                                                    <p className={`text-xs mt-1 ${INSIGHT_TONES.risk.body}`}>{risk.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={`p-3 ${INSIGHT_TONES.positive.card}`}>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className={`w-4 h-4 ${INSIGHT_TONES.positive.icon}`} />
                                        <p className={`text-sm font-medium ${INSIGHT_TONES.positive.title}`}>No significant risk factors detected</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Positive Indicators */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 ${INSIGHT_TONES.positive.icon}`} />
                            Positive Indicators
                        </h3>
                        <div className="space-y-3">
                            {predictions.positiveIndicators.length > 0 ? (
                                predictions.positiveIndicators.map((indicator, index) => {
                                    const Icon = indicator.icon;
                                    return (
                                        <div key={index} className={`p-3 ${INSIGHT_TONES.positive.card}`}>
                                            <div className="flex items-start gap-2">
                                                <Icon className={`w-4 h-4 mt-0.5 ${indicator.color}`} />
                                                <div>
                                                    <p className={`text-sm font-medium ${INSIGHT_TONES.positive.title}`}>{indicator.title}</p>
                                                    <p className={`text-xs mt-1 ${INSIGHT_TONES.positive.body}`}>{indicator.message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className={`p-3 ${INSIGHT_TONES.warning.card}`}>
                                    <div className="flex items-center gap-2">
                                        <Clock className={`w-4 h-4 ${INSIGHT_TONES.warning.icon}`} />
                                        <p className={`text-sm font-medium ${INSIGHT_TONES.warning.title}`}>Monitoring for positive indicators</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trend Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mood Trends */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Predicted Mood Distribution</h3>
                        <div className="space-y-2">
                            {predictions.topMoods.map((moodData, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-card/20 rounded">
                                    <span className="text-sm font-medium text-foreground capitalize">
                                        {moodData.mood}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500 ease-out"
                                                style={{ width: `${moodData.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-8 text-right">
                                            {moodData.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weather Trends */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3">Predicted Weather Patterns</h3>
                        <div className="space-y-2">
                            {predictions.topWeather.map((weatherData, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-card/20 rounded">
                                    <span className="text-sm font-medium text-foreground capitalize">
                                        {weatherData.weather}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 bg-muted/30 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="h-full bg-secondary transition-all duration-500 ease-out"
                                                style={{ width: `${weatherData.percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground w-8 text-right">
                                            {weatherData.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Recommendations</h3>
                    <ul className="text-xs text-muted-foreground space-y-1">
                        {predictions.supportRate > 15 && (
                            <li>• Consider scheduling team wellness check-ins for next week</li>
                        )}
                        {predictions.topMoods.some(m => ['sad', 'anxious'].includes(m.mood)) && (
                            <li>• Prepare additional mental health resources and support channels</li>
                        )}
                        {predictions.topMoods.some(m => ['happy', 'excited'].includes(m.mood)) && (
                            <li>• Leverage positive momentum to maintain team engagement</li>
                        )}
                        <li>• Monitor weather patterns as they correlate with team well-being</li>
                        <li>• Continue tracking these metrics for more accurate predictions</li>
                    </ul>
                </div>
            </div>
        </div>
    );
});

PredictiveAnalytics.displayName = 'PredictiveAnalytics';

export default PredictiveAnalytics;
