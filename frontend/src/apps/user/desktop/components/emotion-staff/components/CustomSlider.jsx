import React, { memo } from "react";

const SliderTrack = memo(({ progressPercentage, feedback, currentValue, onChange, min, max }) => (
    <div className="relative px-2">
        <div className="absolute inset-x-2 top-1/2 -translate-y-1/2 h-2 bg-muted/30 rounded-full" />
        <div
            className="absolute left-2 top-1/2 -translate-y-1/2 h-2 rounded-full transition-all duration-300"
            style={{
                width: `calc(${progressPercentage}% - 0.5rem)`,
                background: `linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--gold)) 50%, hsl(var(--emerald)) 100%)`
            }}
        />
        <input
            type="range"
            min={min}
            max={max}
            value={currentValue}
            onChange={(e) => onChange([parseInt(e.target.value)])}
            className="relative w-full h-2 appearance-none bg-transparent cursor-pointer z-10"
            style={{ WebkitAppearance: 'none' }}
        />
    </div>
));

const SliderLabels = memo(({ labels }) => (
    <div className="flex justify-between items-start px-2 text-xs md:text-sm">
        <div className="flex flex-col items-start max-w-[35%]">
            <span className="font-medium text-primary mb-0.5">1</span>
            <span className="text-muted-foreground leading-tight hidden md:block">
                {labels?.min || 'Low'}
            </span>
            <span className="text-muted-foreground leading-tight md:hidden">
                {labels?.minShort || 'Low'}
            </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="hidden md:inline">{labels?.center || 'Level'}</span>
        </div>
        <div className="flex flex-col items-end max-w-[35%]">
            <span className="font-medium text-emerald mb-0.5">10</span>
            <span className="text-muted-foreground leading-tight text-right hidden md:block">
                {labels?.max || 'High'}
            </span>
            <span className="text-muted-foreground leading-tight text-right md:hidden">
                {labels?.maxShort || 'High'}
            </span>
        </div>
    </div>
));

const CustomSlider = memo(({ currentValue, onChange, feedback, min = 1, max = 10, labels }) => {
    const progressPercentage = ((currentValue - min) / (max - min)) * 100;

    return (
        <div className="space-y-3 pt-4">
            <SliderTrack
                progressPercentage={progressPercentage}
                feedback={feedback}
                currentValue={currentValue}
                onChange={onChange}
                min={min}
                max={max}
            />
            <SliderLabels labels={labels} />
        </div>
    );
});

CustomSlider.displayName = 'CustomSlider';
export default CustomSlider;