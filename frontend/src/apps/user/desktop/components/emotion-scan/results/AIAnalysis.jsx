import React, { memo } from "react";
import { Brain } from "lucide-react";

const AIAnalysis = memo(({ analysis }) => (
    <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wide mb-2 flex items-center gap-2">
            <Brain className="w-3 h-3" />
            AI Analysis
        </h4>
        <p className="text-sm leading-relaxed text-foreground">
            {analysis.aiAnalysis}
        </p>
    </div>
));

AIAnalysis.displayName = 'AIAnalysis';
export default AIAnalysis;