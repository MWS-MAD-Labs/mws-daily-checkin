import React, { memo, useMemo } from "react";

// Optimized decorative elements - reduced GPU usage
const DecorativeBlob = memo(({ className, delay = 0, isMobile }) => {
    // Skip animations on mobile for performance
    if (isMobile) {
        return (
            <div className={`absolute rounded-full blur-2xl pointer-events-none opacity-20 ${className}`} />
        );
    }

    return (
        <div
            className={`absolute rounded-full blur-2xl pointer-events-none ${className}`}
            style={{
                animation: `blob-float 12s ease-in-out infinite`,
                animationDelay: `${delay}s`
            }}
        />
    );
});

DecorativeBlob.displayName = 'DecorativeBlob';

const GridPattern = memo(() => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.015] dark:opacity-[0.025]">
        {/* Static grid pattern - no animation for performance */}
        <div
            className="absolute inset-0"
            style={{
                backgroundImage: `
                    linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
                    linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
                `,
                backgroundSize: '32px 32px'
            }}
        />
    </div>
));

const DecorativeElements = memo(({ isMobile }) => (
    <>
        <GridPattern />
        {/* Reduced blob count and simplified animations for performance */}
        <DecorativeBlob
            className="-top-32 -left-32 w-80 h-80 md:w-96 md:h-96 bg-primary/6"
            delay={0}
            isMobile={isMobile}
        />
        {!isMobile && (
            <DecorativeBlob
                className="-bottom-32 -right-32 w-72 h-72 md:w-80 md:h-80 bg-gold/4"
                delay={1.5}
                isMobile={isMobile}
            />
        )}
    </>
));

DecorativeElements.displayName = 'DecorativeElements';
export default DecorativeElements;