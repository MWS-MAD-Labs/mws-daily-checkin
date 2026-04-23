import React, { memo } from "react";
import { Heart } from "lucide-react";

const WeatherReport = memo(({ analysis }) => (
    <div className="bg-surface/50 rounded-lg p-3 border border-border/30">
        <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
                    Internal Weather Report
                </h4>
                <p className="text-sm font-semibold text-foreground mb-1">
                    {analysis.internalWeather}
                </p>
                <p className="text-xs text-muted-foreground">
                    {analysis.weatherDesc}
                </p>
            </div>
        </div>
    </div>
));

WeatherReport.displayName = 'WeatherReport';
export default WeatherReport;