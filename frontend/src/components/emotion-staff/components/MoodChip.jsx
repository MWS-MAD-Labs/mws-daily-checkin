import React, { memo, useMemo } from "react";
import { Smile, Frown, Zap, AlertCircle, Coffee, Moon, Users, XCircle, Brain, Shuffle, Sparkles, Flame, Shield, HeartPulse } from "lucide-react";

const iconMap = {
    "Smile": Smile,
    "Frown": Frown,
    "Zap": Zap,
    "AlertCircle": AlertCircle,
    "Coffee": Coffee,
    "Moon": Moon,
    "Users": Users,
    "XCircle": XCircle,
    "Brain": Brain,
    "Shuffle": Shuffle,
    "Sparkles": Sparkles,
    "Flame": Flame,
    "Shield": Shield,
    "HeartPulse": HeartPulse
};

const getColorClasses = (color) => {
    const colors = {
        gold: { selected: 'border-gold bg-gold/10 shadow-gold/20', text: 'text-gold', gradient: 'from-gold/15', hover: 'hover:border-gold/60 hover:bg-gold/5' },
        emerald: { selected: 'border-emerald bg-emerald/10 shadow-emerald/20', text: 'text-emerald', gradient: 'from-emerald/15', hover: 'hover:border-emerald/60 hover:bg-emerald/5' },
        primary: { selected: 'border-primary bg-primary/10 shadow-primary/20', text: 'text-primary', gradient: 'from-primary/15', hover: 'hover:border-primary/60 hover:bg-primary/5' },
        muted: { selected: 'border-muted-foreground bg-muted/20 shadow-muted/20', text: 'text-muted-foreground', gradient: 'from-muted/20', hover: 'hover:border-muted/60 hover:bg-muted/10' }
    };
    return colors[color] || colors.primary;
};

const CheckboxIndicator = memo(({ isSelected, colorClasses }) => (
    <div className={`relative flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded border-2 transition-all duration-300 ${isSelected ? `border-current ${colorClasses.text} bg-current` : 'border-border bg-card group-hover:border-current'}`}>
        {isSelected && (
            <svg className="absolute inset-0 w-full h-full p-0.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        )}
    </div>
));

const MoodIcon = memo(({ Icon, isSelected, colorClasses }) => (
    <Icon className={`hidden md:block w-4 h-4 transition-all duration-300 ${isSelected ? colorClasses.text : 'text-muted-foreground group-hover:' + colorClasses.text}`} />
));

const MoodLabel = memo(({ mood, isSelected, colorClasses }) => (
    <span className={`text-xs md:text-sm font-medium leading-tight transition-colors duration-300 ${isSelected ? colorClasses.text : 'text-foreground group-hover:' + colorClasses.text}`}>
        {mood.label}
    </span>
));

const SelectionOverlay = memo(({ isSelected, colorClasses }) => (
    isSelected && (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
            <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} to-transparent opacity-30`} />
        </div>
    )
));

const HoverShimmer = memo(({ colorClasses }) => (
    <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${colorClasses.gradient} to-transparent`} />
));

const MoodChip = memo(({ mood, isSelected, onToggle, index }) => {
    const Icon = iconMap[mood.icon];
    const colorClasses = useMemo(() => getColorClasses(mood.color), [mood.color]);

    return (
        <button
            onClick={onToggle}
            className={`group relative p-2.5 md:p-3 rounded-lg border transition-all duration-300 ease-premium flex items-center gap-2 md:gap-2.5 ${isSelected ? `${colorClasses.selected} shadow-md scale-[1.02]` : `border-border bg-card/50 ${colorClasses.hover}`}`}
            style={{ transitionDelay: `${index * 15}ms` }}
        >
            <div className="glass__refract opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="glass__noise" />
            <CheckboxIndicator isSelected={isSelected} colorClasses={colorClasses} />
            <MoodIcon Icon={Icon} isSelected={isSelected} colorClasses={colorClasses} />
            <MoodLabel mood={mood} isSelected={isSelected} colorClasses={colorClasses} />
            <SelectionOverlay isSelected={isSelected} colorClasses={colorClasses} />
            <HoverShimmer colorClasses={colorClasses} />
        </button>
    );
});

MoodChip.displayName = 'MoodChip';
export default MoodChip;
