import React, { memo } from "react";
import { Sparkles } from "lucide-react";
import MoodIcon from "./MoodIcon";

const MoodDistribution = memo(({ distribution }) => {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    const moods = [
        { key: "happy", label: "Happy", color: "emerald" },
        { key: "excited", label: "Excited", color: "gold" },
        { key: "okay", label: "Okay", color: "muted" },
        { key: "sad", label: "Sad", color: "primary" }
    ];

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Today's Mood Distribution
                    </h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {moods.map(({ key, label, color }, index) => {
                        const count = distribution[key] || 0;
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

                        return (
                            <div
                                key={key}
                                className="text-center space-y-2 p-3 rounded-lg bg-card/30 border border-border/30 transition-all duration-300 hover:border-border/60"
                                style={{ transitionDelay: `${index * 50}ms` }}
                            >
                                <MoodIcon mood={key} size="w-6 h-6 md:w-8 md:h-8 mx-auto" />
                                <div>
                                    <div className="text-lg md:text-xl font-bold text-foreground">{count}</div>
                                    <div className="text-xs text-muted-foreground">{percentage}%</div>
                                </div>
                                <div className="text-xs font-medium text-muted-foreground">{label}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

MoodDistribution.displayName = 'MoodDistribution';
export default MoodDistribution;