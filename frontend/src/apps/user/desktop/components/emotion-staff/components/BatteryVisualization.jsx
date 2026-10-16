import React, { memo, useMemo } from "react";

const BatteryVisualization = memo(({ currentValue, feedback }) => {
    // Battery segments calculation
    const batterySegments = useMemo(() => {
        return Array.from({ length: 10 }, (_, i) => ({
            active: i < currentValue,
            index: i
        }));
    }, [currentValue]);

    return (
        <div className="flex justify-center">
            <div className="relative">
                {/* Glow effect - reduced for performance */}
                <div
                    className="absolute inset-0 rounded-xl blur-lg opacity-20"
                    style={{ backgroundColor: `hsl(var(--${feedback.color}))` }}
                />

                {/* Battery container */}
                <div className="relative flex items-center gap-1 p-2 rounded-xl bg-card/50 border border-border">
                    {/* Battery segments */}
                    {batterySegments.map((segment) => (
                        <div
                            key={segment.index}
                            className={`
                                w-4 h-12 md:w-5 md:h-14 rounded transition-all duration-300
                                ${segment.active
                                    ? 'bg-current scale-y-100'
                                    : 'bg-muted/20 scale-y-50'
                                }
                            `}
                            style={segment.active ? {
                                color: `hsl(var(--${feedback.color}))`,
                                boxShadow: `0 2px 8px hsla(var(--${feedback.color}), 0.3)`
                            } : {}}
                        />
                    ))}

                    {/* Battery tip */}
                    <div
                        className="w-1 h-6 md:h-8 rounded-r bg-current transition-colors duration-300"
                        style={{ color: currentValue > 0 ? `hsl(var(--${feedback.color}))` : 'hsl(var(--muted))' }}
                    />
                </div>

                {/* Value display */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 translate-y-full">
                    <div className="px-3 py-1.5 rounded-full bg-card border border-border shadow-lg">
                        <span className="text-sm font-bold" style={{ color: `hsl(var(--${feedback.color}))` }}>
                            {currentValue} / 10
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

BatteryVisualization.displayName = 'BatteryVisualization';
export default BatteryVisualization;