import React, { memo } from "react";
import { Target, Activity } from "lucide-react";

const PrimaryNavButtons = memo(({ onMTSSClick, onDailyCheckinClick }) => (
    <div className="flex flex-col sm:flex-row gap-3 mb-6 md:mb-8">
        <button
            onClick={onMTSSClick}
            className="group relative flex-1 glass glass-card hover-lift transition-all duration-300 overflow-hidden"
        >
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-primary/15 to-primary/10 border border-primary/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <Target className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">MTSS</h3>
                <p className="text-xs text-muted-foreground">Multi-Tiered Support System</p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        <button
            onClick={onDailyCheckinClick}
            className="group relative flex-1 glass glass-card hover-lift transition-all duration-300 overflow-hidden"
        >
            <div className="glass__refract" />
            <div className="glass__noise" />

            <div className="relative z-10 p-4 md:p-6 text-center">
                <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br from-gold/15 to-gold/10 border border-gold/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    <Activity className="w-6 h-6 md:w-7 md:h-7 text-gold" />
                </div>
                <h3 className="text-sm md:text-base font-semibold text-foreground mb-1">Daily Check-in</h3>
                <p className="text-xs text-muted-foreground">Monitor student wellness</p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
    </div>
));

PrimaryNavButtons.displayName = 'PrimaryNavButtons';
export default PrimaryNavButtons;