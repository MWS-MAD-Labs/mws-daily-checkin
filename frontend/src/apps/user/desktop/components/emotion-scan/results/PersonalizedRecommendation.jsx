import React, { memo } from "react";
import { Zap } from "lucide-react";

const PersonalizedRecommendation = memo(({ recommendation, actions }) => (
    <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border-2 border-primary/30">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
            <Zap className="w-3 h-3" />
            Recommendation
        </h4>
        <p className="text-sm leading-relaxed text-foreground mb-3">
            {recommendation}
        </p>
        <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Actions:</p>
            {actions.map((action, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-foreground">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <span className="flex-1">{action}</span>
                </div>
            ))}
        </div>
    </div>
));

PersonalizedRecommendation.displayName = 'PersonalizedRecommendation';
export default PersonalizedRecommendation;