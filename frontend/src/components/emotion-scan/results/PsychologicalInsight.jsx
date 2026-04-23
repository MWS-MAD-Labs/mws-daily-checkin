import React, { memo } from "react";
import { Target } from "lucide-react";

const PsychologicalInsight = memo(({ insight }) => (
    <div className="bg-surface/50 rounded-lg p-3 border border-border/30">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
            <Target className="w-3 h-3" />
            Insight
        </h4>
        <p className="text-sm leading-relaxed text-foreground">
            {insight}
        </p>
    </div>
));

PsychologicalInsight.displayName = 'PsychologicalInsight';
export default PsychologicalInsight;