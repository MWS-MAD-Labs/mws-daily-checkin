import React, { memo } from "react";

const AIReasoning = memo(({ reasoning }) => (
    <div className="text-xs text-muted-foreground bg-surface/30 p-2 rounded border border-border/20">
        <strong className="text-foreground">AI Reasoning:</strong> {reasoning}
    </div>
));

AIReasoning.displayName = 'AIReasoning';
export default AIReasoning;