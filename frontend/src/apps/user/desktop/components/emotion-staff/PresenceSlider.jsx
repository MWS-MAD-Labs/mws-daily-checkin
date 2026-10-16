import React, { memo, useMemo } from "react";
import { Heart } from "lucide-react";
import PresenceIndicator from "./components/PresenceIndicator";
import CustomSlider from "./components/CustomSlider";
import FeedbackCard from "./components/FeedbackCard";

const getFeedback = (currentValue) => {
    if (currentValue <= 3) return { text: "Your attention seems scattered. Take a moment to center yourself.", color: "primary", icon: "🌫️", gradient: "from-primary/15" };
    if (currentValue <= 6) return { text: "You're somewhat present. A few deep breaths might help you focus.", color: "gold", icon: "⛅", gradient: "from-gold/15" };
    if (currentValue <= 8) return { text: "Good presence! You're engaged and focused on what matters.", color: "emerald", icon: "☀️", gradient: "from-emerald/15" };
    return { text: "Exceptional presence! You're fully here, heart and mind aligned.", color: "emerald", icon: "✨", gradient: "from-emerald/20" };
};

const Header = memo(() => (
    <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center transition-all duration-300 hover:scale-105">
            <Heart className="w-6 h-6 md:w-7 md:h-7 text-primary" fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">
                Presence Level
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                How focused are you right now?
            </p>
        </div>
    </div>
));

const ScaleIndicators = memo(({ currentValue, feedback, onPresenceChange }) => (
    <div className="flex justify-between gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
                key={num}
                onClick={() => onPresenceChange([num])}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${currentValue === num ? 'bg-current scale-y-150' : 'bg-border hover:bg-muted-foreground/30'}`}
                style={currentValue === num ? { color: `hsl(var(--${feedback.color}))`, boxShadow: `0 2px 8px hsla(var(--${feedback.color}), 0.4)` } : {}}
                aria-label={`Set presence to ${num}`}
            />
        ))}
    </div>
));

const PresenceSlider = memo(({ presence, onPresenceChange }) => {
    const currentValue = presence[0];
    const feedback = useMemo(() => getFeedback(currentValue), [currentValue]);

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__refract--soft" />
            <div className="glass__noise" />
            <div className="relative z-10 p-5 md:p-6 space-y-5">
                <Header />
                <PresenceIndicator currentValue={currentValue} feedback={feedback} />
                <CustomSlider
                    currentValue={currentValue}
                    onChange={onPresenceChange}
                    feedback={feedback}
                    labels={{ min: "Distracted", minShort: "Scattered", center: "Focus Level", max: "Fully Present", maxShort: "Focused" }}
                />
                <FeedbackCard feedback={feedback} />
                <ScaleIndicators currentValue={currentValue} feedback={feedback} onPresenceChange={onPresenceChange} />
            </div>
        </div>
    );
});

PresenceSlider.displayName = 'PresenceSlider';
export default PresenceSlider;