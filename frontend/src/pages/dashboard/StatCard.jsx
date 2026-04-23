import React, { memo } from "react";
import { ArrowUpRight } from "lucide-react";

const StatCard = memo(({ icon: Icon, iconColor, title, value, subtitle, trend }) => (
    <div className="glass glass-card hover-lift transition-all duration-300">
        <div className="glass__refract" />
        <div className="glass__noise" />

        <div className="relative z-10 p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-${iconColor}/15 to-${iconColor}/10 border border-${iconColor}/30 flex items-center justify-center transition-all duration-300 hover:scale-105`}>
                    <Icon className={`w-5 h-5 md:w-6 md:h-6 text-${iconColor}`} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 text-emerald text-xs font-medium px-2 py-1 rounded-full bg-emerald/10 border border-emerald/20">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
                <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    </div>
));

StatCard.displayName = 'StatCard';
export default StatCard;