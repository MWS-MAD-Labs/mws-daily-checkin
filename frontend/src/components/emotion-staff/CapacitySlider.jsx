import React, { memo, useMemo } from "react";
import { Zap } from "lucide-react";
import BatteryVisualization from "./components/BatteryVisualization";
import CustomSlider from "./components/CustomSlider";
import FeedbackCard from "./components/FeedbackCard";

const getFeedback = (currentValue) => {
    if (currentValue <= 3) return { text: "You're at maximum capacity. Time to discuss workload priorities.", color: "primary", icon: "🔴", gradient: "from-primary/15", batteryLevel: "critical" };
    if (currentValue <= 5) return { text: "Your workload is heavy. Focus on what's most important today.", color: "primary", icon: "🟠", gradient: "from-primary/12", batteryLevel: "low" };
    if (currentValue <= 7) return { text: "You're managing well. Keep monitoring your capacity balance.", color: "gold", icon: "🟡", gradient: "from-gold/15", batteryLevel: "medium" };
    if (currentValue <= 9) return { text: "Great capacity! You're ready to take on additional projects.", color: "emerald", icon: "🟢", gradient: "from-emerald/15", batteryLevel: "good" };
    return { text: "Peak capacity! You're primed for new challenges and opportunities.", color: "emerald", icon: "⚡", gradient: "from-emerald/20", batteryLevel: "full" };
};

const Header = memo(() => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-gold/10 to-gold/5 border border-gold/20 flex items-center justify-center transition-all duration-300 hover:scale-105">
            <Zap className="w-6 h-6 md:w-7 md:h-7 text-gold" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
                Capacity Level
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                How much can you take on today?
            </p>
        </div>
    </div>
));

const CapacityIndicators = memo(({ currentValue }) => (
    <div className="grid grid-cols-3 gap-2">
        <div className={`p-2 md:p-3 rounded-lg border text-center transition-all duration-300 ${currentValue <= 3 ? 'bg-primary/10 border-primary/30 scale-105' : 'bg-card/30 border-border/50 opacity-50'}`}>
            <div className="text-lg md:text-xl mb-1">⚠️</div>
            <p className="text-xs font-medium text-muted-foreground">High Load</p>
        </div>
        <div className={`p-2 md:p-3 rounded-lg border text-center transition-all duration-300 ${currentValue > 3 && currentValue <= 7 ? 'bg-gold/10 border-gold/30 scale-105' : 'bg-card/30 border-border/50 opacity-50'}`}>
            <div className="text-lg md:text-xl mb-1">⚖️</div>
            <p className="text-xs font-medium text-muted-foreground">Balanced</p>
        </div>
        <div className={`p-2 md:p-3 rounded-lg border text-center transition-all duration-300 ${currentValue > 7 ? 'bg-emerald/10 border-emerald/30 scale-105' : 'bg-card/30 border-border/50 opacity-50'}`}>
            <div className="text-lg md:text-xl mb-1">🚀</div>
            <p className="text-xs font-medium text-muted-foreground">Ready</p>
        </div>
    </div>
));

const CapacitySlider = memo(({ capacity, onCapacityChange }) => {
    const currentValue = capacity[0];
    const feedback = useMemo(() => getFeedback(currentValue), [currentValue]);

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />
            <div className="relative z-10 p-5 md:p-6 space-y-5">
                <Header />
                <BatteryVisualization currentValue={currentValue} feedback={feedback} />
                <CustomSlider
                    currentValue={currentValue}
                    onChange={onCapacityChange}
                    feedback={feedback}
                    labels={{ min: "Overwhelmed", minShort: "Maxed Out", center: "Energy Level", max: "Ready for More", maxShort: "Energized" }}
                />
                <FeedbackCard feedback={feedback} />
                <CapacityIndicators currentValue={currentValue} />
            </div>
        </div>
    );
});

CapacitySlider.displayName = 'CapacitySlider';
export default CapacitySlider;