import React, { memo } from "react";

const PresenceIndicator = memo(({ currentValue, feedback }) => (
    <div className="flex justify-center">
        <div className="relative">
            {/* Pulse rings - reduced for performance */}
            <div
                className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ backgroundColor: `hsl(var(--${feedback.color}))` }}
            />

            {/* Main value container */}
            <div
                className="relative w-20 h-20 md:w-24 md:h-24 rounded-full border-4 flex items-center justify-center transition-all duration-500 ease-premium bg-gradient-to-br"
                style={{
                    borderColor: `hsl(var(--${feedback.color}))`,
                    boxShadow: `0 8px 24px hsla(var(--${feedback.color}), 0.2)`,
                    background: `linear-gradient(135deg, hsla(var(--${feedback.color}), 0.1) 0%, transparent 100%)`
                }}
            >
                <div className="text-center">
                    <div
                        className="text-3xl md:text-4xl font-bold"
                        style={{ color: `hsl(var(--${feedback.color}))` }}
                    >
                        {currentValue}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">/ 10</div>
                </div>
            </div>
        </div>
    </div>
));

PresenceIndicator.displayName = 'PresenceIndicator';
export default PresenceIndicator;