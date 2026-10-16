import React, { memo } from "react";

const CapacityMetrics = memo(({ capacity }) => (
    <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface/50 rounded-lg p-3 border border-border/30 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold">
                Presence
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
                {capacity.estimatedPresence}/10
            </div>
            <div className="text-[10px] text-muted-foreground">Engagement level</div>
        </div>
        <div className="bg-surface/50 rounded-lg p-3 border border-border/30 text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1 font-bold">
                Capacity
            </div>
            <div className="text-2xl font-bold text-primary mb-1">
                {capacity.estimatedCapacity}/10
            </div>
            <div className="text-[10px] text-muted-foreground">Workload bandwidth</div>
        </div>
    </div>
));

CapacityMetrics.displayName = 'CapacityMetrics';
export default CapacityMetrics;