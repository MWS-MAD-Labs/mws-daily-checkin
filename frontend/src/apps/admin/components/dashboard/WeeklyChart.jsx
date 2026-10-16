import React, { memo } from "react";
import { TrendingUp } from "lucide-react";

const WeeklyChart = memo(({ data }) => {
    const maxCheckins = Math.max(...data.map(d => d.checkins));

    return (
        <div className="glass glass-card hover-lift transition-all duration-300">
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald" />
                    <h2 className="text-base md:text-lg font-semibold text-foreground">
                        Weekly Activity
                    </h2>
                </div>

                <div className="flex items-end justify-between gap-1 md:gap-2 h-32 md:h-40">
                    {data.map((day, index) => {
                        const heightPercent = (day.checkins / maxCheckins) * 100;

                        return (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                                <div className="relative w-full max-w-[32px] md:max-w-[40px]" style={{ height: `${heightPercent}%` }}>
                                    <div
                                        className="absolute inset-0 rounded-t-md bg-gradient-to-t from-primary via-gold to-emerald transition-all duration-300 hover:opacity-80 cursor-pointer"
                                        style={{
                                            transitionDelay: `${index * 50}ms`,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                    {day.flagged > 0 && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary border-2 border-card flex items-center justify-center shadow-lg">
                                            <span className="text-xs font-bold text-primary-foreground">{day.flagged}</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">{day.day}</span>
                                <span className="text-xs text-foreground font-semibold hidden md:block">{day.checkins}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

WeeklyChart.displayName = 'WeeklyChart';
export default WeeklyChart;
