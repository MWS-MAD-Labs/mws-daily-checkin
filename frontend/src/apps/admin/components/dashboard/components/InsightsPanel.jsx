import React, { memo, useState } from "react";
import { AlertTriangle, CheckCircle, Info, AlertCircle, Sparkles, Loader2 } from "lucide-react";

const InsightsPanel = memo(({ insights = [] }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [showInsights, setShowInsights] = useState(false);

    const handleGetInsights = async () => {
        setIsLoading(true);
        // Simulate API call delay
        setTimeout(() => {
            setIsLoading(false);
            setShowInsights(true);
        }, 2000); // 2 second delay to simulate processing
    };

    if (!insights || insights.length === 0) {
        return (
            <div className="mb-6">
                <div className="glass glass-card p-6 text-center">
                    <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">AI Insights & Recommendations</h3>
                    <p className="text-muted-foreground mb-4">
                        Get personalized insights about your team's emotional wellness patterns
                    </p>
                    <button
                        onClick={handleGetInsights}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Get AI Insights
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (!showInsights) {
        return (
            <div className="mb-6">
                <div className="glass glass-card p-6 text-center">
                    <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">AI Insights Available</h3>
                    <p className="text-muted-foreground mb-4">
                        {insights.length} insights ready to view
                    </p>
                    <button
                        onClick={() => setShowInsights(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        View Insights
                    </button>
                </div>
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />;
            case 'alert':
                return <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
        }
    };

    const getBgColor = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50';
            case 'warning':
                return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50';
            case 'alert':
                return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50';
            default:
                return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50';
        }
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">AI Insights & Recommendations</h3>
            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg border ${getBgColor(insight.type)}`}
                    >
                        <div className="flex items-start gap-3">
                            {getIcon(insight.type)}
                            <div className="flex-1">
                                <h4 className="font-medium text-foreground mb-1">
                                    {insight.title}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

InsightsPanel.displayName = 'InsightsPanel';

export default InsightsPanel;