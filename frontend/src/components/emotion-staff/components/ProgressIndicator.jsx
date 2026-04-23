import React, { memo } from "react";

const ProgressIndicator = memo(({ charCount, maxChars, isFocused }) => {
    const progress = (charCount / maxChars) * 100;
    const isNearLimit = charCount >= maxChars * 0.9;
    const isEmpty = charCount === 0;

    return (
        <div className="space-y-2">
            {/* Progress Bar */}
            <div className="relative h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                    style={{
                        width: `${progress}%`,
                        background: progress < 70
                            ? 'linear-gradient(90deg, hsl(var(--emerald)) 0%, hsl(var(--gold)) 100%)'
                            : progress < 90
                                ? 'linear-gradient(90deg, hsl(var(--gold)) 0%, hsl(var(--primary)) 100%)'
                                : 'hsl(var(--primary))'
                    }}
                />
            </div>

            {/* Info Row */}
            <div className="flex items-center justify-between gap-4">
                {/* Left: Helpful Tips */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="hidden md:inline">
                        {isEmpty
                            ? 'Start typing to share your thoughts'
                            : isNearLimit
                                ? 'Almost at character limit'
                                : 'Your input is secure and private'
                        }
                    </span>
                    <span className="md:hidden">
                        {isEmpty ? 'Start typing' : isNearLimit ? 'Near limit' : 'Secure'}
                    </span>
                </div>

                {/* Right: Word Count */}
                {!isEmpty && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium tabular-nums">
                            {charCount} chars
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});

ProgressIndicator.displayName = 'ProgressIndicator';
export default ProgressIndicator;