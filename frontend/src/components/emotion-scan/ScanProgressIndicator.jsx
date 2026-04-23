import React, { memo } from "react";
import { motion } from "framer-motion";
import { Brain, Eye, Heart, CheckCircle } from "lucide-react";

const ScanProgressIndicator = memo(({ isActive, progress = 0 }) => {
    const stages = [
        { id: 'face', label: 'Face Detection', icon: Eye, color: 'blue' },
        { id: 'landmarks', label: 'Feature Analysis', icon: Brain, color: 'purple' },
        { id: 'emotion', label: 'Emotion Analysis', icon: Heart, color: 'pink' },
        { id: 'complete', label: 'Analysis Complete', icon: CheckCircle, color: 'emerald' }
    ];

    const getCurrentStage = () => {
        if (progress < 25) return 0;
        if (progress < 50) return 1;
        if (progress < 75) return 2;
        return 3;
    };

    const currentStageIndex = getCurrentStage();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
            className="mt-6 space-y-4"
        >
            {/* Progress bar */}
            <div className="glass glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Analysis Progress</span>
                    <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>

                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                </div>
            </div>

            {/* Stage indicators */}
            <div className="grid grid-cols-2 gap-3">
                {stages.map((stage, index) => {
                    const Icon = stage.icon;
                    const isActive = index === currentStageIndex;
                    const isCompleted = index < currentStageIndex;
                    const isPending = index > currentStageIndex;

                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{
                                opacity: isActive || isCompleted ? 1 : 0.6,
                                scale: isActive ? 1.05 : 1
                            }}
                            className={`glass glass-card p-3 rounded-lg text-center ${isActive ? 'ring-2 ring-primary/50' : ''
                                }`}
                        >
                            <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${isCompleted
                                    ? 'bg-emerald-500 text-emerald-foreground'
                                    : isActive
                                        ? `bg-${stage.color}-500 text-${stage.color}-foreground animate-pulse`
                                        : 'bg-muted text-muted-foreground'
                                }`}>
                                {isCompleted ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <Icon className="w-4 h-4" />
                                )}
                            </div>

                            <p className={`text-xs font-medium ${isCompleted
                                    ? 'text-emerald-600'
                                    : isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground'
                                }`}>
                                {stage.label}
                            </p>

                            {isActive && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-1 h-1 bg-primary rounded-full mx-auto mt-1"
                                />
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Current status message */}
            <motion.div
                key={currentStageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <p className="text-sm text-muted-foreground">
                    {stages[currentStageIndex]?.label} in progress...
                </p>
            </motion.div>
        </motion.div>
    );
});

ScanProgressIndicator.displayName = 'ScanProgressIndicator';

export default ScanProgressIndicator;