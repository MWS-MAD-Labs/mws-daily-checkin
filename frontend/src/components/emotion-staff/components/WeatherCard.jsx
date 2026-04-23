import React, { memo, useMemo } from "react";
import { Sun, Cloud, CloudRain, Zap, Tornado, Snowflake, Rainbow, CloudFog, Wind, Flame } from "lucide-react";

const ICONS = {
    Sun, Cloud, CloudRain, Zap, Tornado, Snowflake, Rainbow, CloudFog, Wind, Flame
};

const COLOR_TOKENS = {
    gold: { selected: "border-gold bg-gold/10 shadow-gold/15", iconHover: "group-hover:text-gold", text: "text-gold", gradientFrom: "from-gold/10" },
    emerald: { selected: "border-emerald bg-emerald/10 shadow-emerald/15", iconHover: "group-hover:text-emerald", text: "text-emerald", gradientFrom: "from-emerald/10" },
    primary: { selected: "border-primary bg-primary/10 shadow-primary/15", iconHover: "group-hover:text-primary", text: "text-primary", gradientFrom: "from-primary/10" },
    muted: { selected: "border-muted bg-muted/10 shadow-muted/15", iconHover: "group-hover:text-muted-foreground", text: "text-muted-foreground", gradientFrom: "from-muted/10" }
};

const ICON_COLOR_MAP = {
    Sun: "#F59E0B", Cloud: "#9CA3AF", CloudRain: "#0EA5E9", Zap: "#F97316", Tornado: "#6B7280",
    Snowflake: "#60A5FA", Rainbow: "linear-gradient(45deg,#ff4bd3,#7a5cff,#16f3b1)", CloudFog: "#9CA3AF",
    Wind: "#06B6D4", Flame: "#FB923C"
};

const WeatherIcon = memo(({ Icon, iconClasses, iconStyle }) => (
    <Icon className={iconClasses} style={iconStyle} aria-hidden="true" />
));

const WeatherLabel = memo(({ labelClasses, isSelected, token, weather }) => (
    <span className={`${labelClasses} ${isSelected ? token.text : "text-foreground group-hover:" + token.text}`}>
        <span className="hidden md:inline">{weather.labelFull}</span>
        <span className="md:hidden">{weather.label}</span>
    </span>
));

const SelectedOverlay = memo(({ token, weather }) => (
    <div className="absolute inset-0 rounded-lg pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br ${token.gradientFrom} to-transparent opacity-40`} aria-hidden />
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full shadow-lg" style={{ background: `hsl(var(--${weather.color}))` }} aria-hidden />
    </div>
));

const HoverShimmer = memo(({ token }) => (
    <div
        className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${token.gradientFrom} to-transparent`}
        aria-hidden
    />
));

const WeatherCard = memo(function WeatherCard({ weather, isSelected, onClick, index = 0 }) {
    const Icon = ICONS[weather.icon] || Sun;
    const token = COLOR_TOKENS[weather.color] || COLOR_TOKENS.primary;

    const wrapperClasses = useMemo(() => {
        const base = "group relative rounded-lg border transition-all duration-300 ease-premium focus:outline-none focus-visible:ring-4 focus-visible:ring-opacity-20";
        const sizePadding = "p-3 md:p-4";
        const selected = isSelected ? `${token.selected} transform scale-[1.02]` : `border-border bg-card/40`;
        return `${base} ${sizePadding} ${selected}`;
    }, [isSelected, token]);

    const iconClasses = useMemo(() => {
        const base = "w-7 h-7 md:w-9 md:h-9 transition-transform duration-300 ease-premium";
        const scale = isSelected ? "scale-110" : "group-hover:scale-105";
        const colorClass = isSelected ? token.text : `text-muted-foreground ${token.iconHover}`;
        return `${base} ${scale} ${colorClass}`;
    }, [isSelected, token]);

    const labelClasses = useMemo(() => "text-xs md:text-sm font-medium leading-tight transition-colors duration-300", []);

    const iconStyle = useMemo(() => {
        const raw = ICON_COLOR_MAP[weather.icon];
        if (!raw) return undefined;
        if (raw.startsWith("linear-gradient")) return { color: "#A78BFA" };
        return { color: raw };
    }, [weather.icon]);

    const transitionDelayStyle = useMemo(() => ({ transitionDelay: `${index * 25}ms` }), [index]);

    return (
        <button
            type="button"
            role="button"
            aria-pressed={isSelected}
            onClick={onClick}
            className={wrapperClasses}
            style={transitionDelayStyle}
        >
            <div className="glass__refract opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            <div className="glass__noise pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center gap-2">
                <WeatherIcon Icon={Icon} iconClasses={iconClasses} iconStyle={iconStyle} />
                <WeatherLabel labelClasses={labelClasses} isSelected={isSelected} token={token} weather={weather} />
            </div>
            {isSelected && <SelectedOverlay token={token} weather={weather} />}
            <HoverShimmer token={token} />
        </button>
    );
});

WeatherCard.displayName = "WeatherCard";
export default WeatherCard;
