import React, { memo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, Eye, Brain, Heart } from "lucide-react";

const EmotionAnalysisDisplay = memo(({ results }) => {
    if (!results) return null;

    const { emotions, valence, arousal, intensity, confidence, detectedFeatures } = results;

    // Sort emotions by probability
    const topEmotions = Object.entries(emotions || {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const getValenceIcon = (val) => {
        if (val > 0.3) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
        if (val < -0.3) return <TrendingDown className="w-4 h-4 text-red-500" />;
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    };

    const getArousalIcon = (ar) => {
        if (ar > 0.5) return <TrendingUp className="w-4 h-4 text-orange-500" />;
        if (ar < 0.2) return <TrendingDown className="w-4 h-4 text-blue-500" />;
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Main emotion results */}
            <div className="glass glass-card p-6 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">AI Analysis Results</h3>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="text-sm text-muted-foreground">Confidence:</div>
                        <div className="px-2 py-1 bg-emerald-500/10 text-emerald-600 rounded text-xs font-medium">
                            {confidence}%
                        </div>
                    </div>
                </div>

                {/* Top emotions */}
                <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-foreground">Detected Emotions</h4>
                    {topEmotions.map(([emotion, probability], index) => (
                        <motion.div
                            key={emotion}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between p-3 bg-card/40 rounded-lg border border-border/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Heart className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium text-foreground capitalize">{emotion}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-20 bg-muted/30 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${probability * 100}%` }}
                                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                    />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground w-12 text-right">
                                    {Math.round(probability * 100)}%
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Valence and Arousal */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-card/40 rounded-lg border border-border/40">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {getValenceIcon(valence)}
                            <span className="text-sm font-medium text-foreground">Valence</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {valence > 0 ? '+' : ''}{Math.round(valence * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {valence > 0.3 ? 'Positive' : valence < -0.3 ? 'Negative' : 'Neutral'}
                        </div>
                    </div>

                    <div className="text-center p-4 bg-card/40 rounded-lg border border-border/40">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            {getArousalIcon(arousal)}
                            <span className="text-sm font-medium text-foreground">Arousal</span>
                        </div>
                        <div className="text-2xl font-bold text-foreground">
                            {Math.round(arousal * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {arousal > 0.5 ? 'High Energy' : arousal < 0.2 ? 'Calm' : 'Moderate'}
                        </div>
                    </div>
                </div>

                {/* Intensity and Features */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-card/40 rounded-lg border border-border/40">
                        <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">Emotional Intensity</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted/30 rounded-full h-2 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                                    style={{ width: `${intensity}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-muted-foreground w-10 text-right">
                                {intensity}%
                            </span>
                        </div>
                    </div>

                    {detectedFeatures && detectedFeatures.length > 0 && (
                        <div className="p-3 bg-card/40 rounded-lg border border-border/40">
                            <div className="text-sm font-medium text-foreground mb-2">Key Features Detected:</div>
                            <div className="flex flex-wrap gap-2">
                                {detectedFeatures.map((feature, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                                    >
                                        {feature.replace(/_/g, ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass glass-card p-4 rounded-xl text-center"
            >
                <p className="text-sm text-muted-foreground">
                    Analysis complete with {confidence}% confidence. These results will be used to generate your personalized emotional wellness insights.
                </p>
            </motion.div>
        </motion.div>
    );
});

EmotionAnalysisDisplay.displayName = 'EmotionAnalysisDisplay';

export default EmotionAnalysisDisplay;